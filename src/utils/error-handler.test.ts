import { describe, it, expect } from 'vitest'
import { AppError, handleError } from './error-handler'

describe('utils/error-handler', () => {
  it('AppError keeps properties', () => {
    const e = new AppError('boom', 418, 'X123')
    expect(e).toBeInstanceOf(Error)
    expect(e.name).toBe('AppError')
    expect(e.message).toBe('boom')
    expect(e.status).toBe(418)
    expect(e.code).toBe('X123')
  })

  it('handleError returns message from AppError', () => {
    const e = new AppError('fail', 400, 'APP')
    expect(handleError(e)).toBe('fail')
  })

  it('handleError maps known DB codes', () => {
    expect(handleError({ code: '23505' })).toBe('Registro duplicado detectado.')
    expect(handleError({ code: '23503' })).toBe(
      'Error de referencia: el registro relacionado no existe.'
    )
    expect(handleError({ code: 'PGRST116' })).toBe(
      'No se encontró el registro solicitado.'
    )
  })

  it('handleError maps unknown DB code to generic DB message including original message', () => {
    expect(handleError({ code: '99999', message: 'detalle' })).toBe(
      'Error en la base de datos: detalle'
    )
  })

  it('handleError with plain object message uses that message', () => {
    expect(handleError({ message: 'algo malo' })).toBe('algo malo')
  })

  it('handleError with primitive returns generic message', () => {
    expect(handleError('string-error')).toBe('Ocurrió un error inesperado.')
    expect(handleError(undefined)).toBe('Ocurrió un error inesperado.')
  })
})
