import { supabase } from '../../services/supabaseClient'
import {
  normalizeHoliday,
  filterHolidaysByPeriod,
} from '../../lib/transformations'
import { useQ, queryKeys } from './utils'
import { Holiday } from './types'

export const useHolidays = (month?: number, year?: number) => {
  return useQ<Holiday[]>(queryKeys.holidays(month, year), async () => {
    const { data, error } = await supabase
      .from('feriados_chile')
      .select('fecha, descripcion, es_irrenunciable')
    if (error) throw error

    const normalized = (data || [])
      .map(normalizeHoliday)
      .filter((h): h is Holiday => h !== null)

    return filterHolidaysByPeriod(normalized, month, year)
  })
}
