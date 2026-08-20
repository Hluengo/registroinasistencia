import { describe, expect, it } from 'vitest'
import { parseTestRows } from './testImport'

const courses = [{ id: 'course-1', name: '1° Básico A' }] as never[]

describe('parseTestRows', () => {
  it('normaliza fechas y relaciona el curso', () => {
    const result = parseTestRows(
      [
        ['curso', 'fecha', 'asignatura', 'tipo'],
        ['1° Básico A', '15/09/2026', 'Matemáticas', 'Control'],
      ],
      courses
    )
    expect(result.issues).toEqual([])
    expect(result.rows[0]).toMatchObject({
      course_id: 'course-1',
      date: '2026-09-15',
    })
  })

  it('rechaza columnas faltantes y cursos desconocidos', () => {
    const result = parseTestRows(
      [
        ['course_name', 'date'],
        ['Otro', 'no'],
      ],
      courses
    )
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'Falta la columna subject',
      'Falta la columna type',
    ])
  })
})
