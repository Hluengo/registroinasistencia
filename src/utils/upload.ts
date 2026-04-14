import { supabase } from '../services/supabaseClient';
import { FILE_CONFIG, RETRY_CONFIG } from '../constants';

export interface UploadResult {
  publicUrl: string | null;
  error: string | null;
  success: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error: string | null;
}

const isAllowedExtension = (ext: string): boolean => {
  return (FILE_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
};

export const validateFile = (file: File): FileValidationResult => {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  
  if (!ext) {
    return { valid: false, error: 'El archivo no tiene extensión.' };
  }
  
  if (!isAllowedExtension(ext)) {
    return { 
      valid: false, 
      error: `Tipo de archivo no permitido. Permitidos: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }
  
  const maxSizeBytes = FILE_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `El archivo excede el tamaño máximo de ${FILE_CONFIG.MAX_FILE_SIZE_MB}MB.` 
    };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío.' };
  }
  
  return { valid: true, error: null };
};

function extractPublicUrl(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  
  const data = (response as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return null;
  
  const publicUrl = (data as Record<string, unknown>).publicUrl || (data as Record<string, unknown>).publicURL;
  return typeof publicUrl === 'string' ? publicUrl : null;
}

export const uploadFile = async (
  file: File,
  bucket: string = FILE_CONFIG.UPLOAD_BUCKET,
  folder: string = 'general'
): Promise<UploadResult> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { publicUrl: null, error: validation.error, success: false };
  }

  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  let attempt = 0;
  let lastError: string | null = null;

  while (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
    attempt += 1;
    try {
      const uploadResponse = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadResponse.error) {
        lastError = uploadResponse.error.message;
        console.warn(`uploadFile: attempt ${attempt} failed`, lastError);
      } else {
        const publicUrlResponse = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        const publicUrl = extractPublicUrl(publicUrlResponse);
        if (publicUrl) {
          return { publicUrl, error: null, success: true };
        }
        lastError = 'No se pudo obtener la URL pública del archivo.';
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Error desconocido en upload';
      console.warn(`uploadFile: attempt ${attempt} exception`, err);
    }

    if (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, attempt * RETRY_CONFIG.BASE_DELAY_MS));
    }
  }

  return { publicUrl: null, error: lastError, success: false };
};

export const deleteFile = async (
  filePath: string,
  bucket: string = FILE_CONFIG.UPLOAD_BUCKET
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar archivo' };
  }
};