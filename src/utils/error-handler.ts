export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const handleError = (error: unknown): string => {
  console.error('[Service Error]:', error)

  if (error instanceof AppError) {
    return error.message
  }

  // Supabase specific errors - cast locally
  const err = error as { code?: string; message?: string } | undefined
  if (err?.code) {
    switch (err.code) {
      case '23505':
        return 'Registro duplicado detectado.'
      case '23503':
        return 'Error de referencia: el registro relacionado no existe.'
      case '42501':
        return 'Permiso denegado en base de datos. Verifica sesión activa y GRANT/RLS en Supabase para este recurso.'
      case 'PGRST116':
        return 'No se encontró el registro solicitado.'
      default:
        return (
          'Error en la base de datos: ' + (err.message || 'Error desconocido')
        )
    }
  }

  return (err && err.message) || 'Ocurrió un error inesperado.'
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) return error.message
  if (error instanceof Error) return error.message
  return 'Error desconocido'
}
