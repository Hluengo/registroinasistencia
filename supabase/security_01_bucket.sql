-- C3: Cambiar bucket documents a privado
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
DROP POLICY IF EXISTS "documents_staff_read" ON storage.objects;

-- Crear política de lectura solo para staff autenticado
CREATE POLICY "documents_staff_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('staff', 'superuser')
  )
);
