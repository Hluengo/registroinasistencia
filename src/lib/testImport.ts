import * as XLSX from 'xlsx'
import { Course } from '../types'
import { TestInsert } from '../types'

export type TestImportIssue = { row: number; message: string }

export type ParsedTestImport = {
  rows: TestInsert[]
  issues: TestImportIssue[]
  totalRows: number
}

const aliases: Record<string, string> = {
  curso: 'course_name',
  curso_nombre: 'course_name',
  course: 'course_name',
  fecha: 'date',
  asignatura: 'subject',
  materia: 'subject',
  tipo: 'type',
  descripcion: 'description',
}

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

const text = (value: unknown) => String(value ?? '').trim()

const pad = (value: number) => String(value).padStart(2, '0')

const dateFromValue = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`
  }

  const valueText = text(value)
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(valueText)
  if (!match) match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(valueText)
  if (!match) return null

  const [first = 0, second = 0, third = 0] = match.slice(1).map(Number)
  const isoOrder = first > 31
  const year = isoOrder ? first : third
  const month = second
  const day = isoOrder ? third : first
  const candidate = new Date(year, month - 1, day)
  return candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
    ? `${year}-${pad(month)}-${pad(day)}`
    : null
}

const courseKey = (name: string) => {
  const compact = normalize(name.replace(/°/g, '')).replace(/[^a-z0-9]/g, '')
  const grade = compact.match(/^\d+/)?.[0]
  const levelMatch = compact.match(/basic[ao]|medi[oa]/)
  if (!grade || !levelMatch || levelMatch.index === undefined) return compact

  const level = levelMatch[0].startsWith('bas') ? 'basica' : 'media'
  const beforeLevel = compact.slice(grade.length, levelMatch.index)
  const afterLevel = compact.slice(levelMatch.index + levelMatch[0].length)
  const letter = `${beforeLevel}${afterLevel}`.match(/[a-z]/)?.[0] ?? ''
  return `${grade}|${level}|${letter}`
}

export const parseTestRows = (
  matrix: unknown[][],
  courses: Course[]
): ParsedTestImport => {
  const headers = (matrix[0] ?? []).map((value) => {
    const key = normalize(value)
    return aliases[key] ?? key
  })
  const indexes = Object.fromEntries(
    headers.map((header, index) => [header, index])
  )
  const getValue = (values: unknown[], key: string) =>
    values[indexes[key] ?? -1]
  const issues: TestImportIssue[] = []
  const rows: TestInsert[] = []
  const seen = new Set<string>()
  const required = ['course_name', 'date', 'subject', 'type']

  for (const header of required) {
    if (indexes[header] === undefined)
      issues.push({ row: 1, message: `Falta la columna ${header}` })
  }
  if (issues.length)
    return { rows, issues, totalRows: Math.max(matrix.length - 1, 0) }

  matrix.slice(1).forEach((values, index) => {
    const rowNumber = index + 2
    if (values.every((value) => text(value) === '')) return

    const courseName = text(getValue(values, 'course_name'))
    const date = dateFromValue(getValue(values, 'date'))
    const subject = text(getValue(values, 'subject'))
    const type = text(getValue(values, 'type'))
    const description = text(getValue(values, 'description'))
    const course = courses.find(
      (item) => courseKey(item.name) === courseKey(courseName)
    )
    const rowIssues: string[] = []

    if (!course)
      rowIssues.push(`Curso no encontrado: ${courseName || '(vacío)'}`)
    if (!date) rowIssues.push('Fecha inválida; use YYYY-MM-DD o DD/MM/YYYY')
    if (!subject) rowIssues.push('Asignatura obligatoria')
    if (!type) rowIssues.push('Tipo obligatorio')
    if (description.length > 1000)
      rowIssues.push('Descripción supera 1000 caracteres')

    const key = `${course?.id}|${date}|${subject.toLowerCase()}|${type.toLowerCase()}`
    if (seen.has(key)) rowIssues.push('Prueba duplicada dentro del archivo')
    if (rowIssues.length || !course || !date) {
      issues.push({ row: rowNumber, message: rowIssues.join('; ') })
      return
    }

    seen.add(key)
    rows.push({
      course_id: course.id,
      date,
      subject,
      type,
      description: description || null,
    })
  })

  return { rows, issues, totalRows: Math.max(matrix.length - 1, 0) }
}

export const parseTestWorkbook = async (
  file: File,
  courses: Course[]
): Promise<ParsedTestImport> => {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: true,
  })
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? '']
  if (!sheet) throw new Error('El archivo no contiene hojas')
  return parseTestRows(
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }),
    courses
  )
}
