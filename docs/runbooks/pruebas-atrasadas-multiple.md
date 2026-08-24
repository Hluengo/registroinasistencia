# Runbook: registrar varias pruebas atrasadas

## Objetivo

Registrar una o más recuperaciones para un estudiante seleccionando primero el curso. Cada prueba seleccionada se guarda como una fila independiente en `public.makeup_exams`.

La funcionalidad no importa datos del ZIP ni modifica registros históricos.

## Flujo operativo

1. Ingresar con una cuenta `staff` o `superuser` que tenga acceso a `inasistencias`.
2. Abrir **Pruebas Atrasadas** y seleccionar **Nueva recuperación**.
3. Seleccionar el curso.
4. Verificar que el selector de estudiante solo muestre estudiantes de ese curso.
5. Seleccionar una o más pruebas del curso.
6. Definir la fecha de recuperación y el estado.
7. Guardar. Se crea una fila por prueba seleccionada.
8. Desde el detalle de una inasistencia, usar **Crear recuperación** para abrir el mismo formulario con curso, estudiante y prueba afectada preseleccionados. Se pueden agregar otras pruebas del curso.

## Reglas de datos

- `student_id` debe pertenecer al tenant activo.
- `test_id` debe corresponder a una prueba del curso seleccionado.
- `original_date` y `subject` se copian desde cada prueba.
- `scheduled_date` se conserva como fecha PostgreSQL `YYYY-MM-DD`.
- `source_absence_id` se conserva cuando el flujo parte desde una inasistencia.
- No se usan hora, sala, nota ni observaciones en el formulario.
- La política RLS existente de `makeup_exams` sigue controlando tenant y roles.

## Validación local

```powershell
npx tsc --noEmit --pretty false
npm run test -- --run
npm run build
npx eslint src/components/makeup-exams/MakeupExamModal.tsx src/hooks/queries/makeupExams.ts src/services/makeupExamService.ts src/utils/makeupExamForm.ts
npm run test:e2e -- e2e/pruebas-atrasadas.spec.ts
```

El `npm run lint` global puede continuar mostrando el baseline histórico de Prettier/CRLF del repositorio; se debe distinguir de los errores focalizados de esta funcionalidad.

## Verificación Supabase

No se requiere migración para este cambio: la tabla existente ya tiene una fila por recuperación y permite `test_id`, `source_absence_id`, `original_date`, `scheduled_date`, `subject` y `status`.

Verificar con la cuenta autorizada:

```sql
select id, tenant_id, student_id, test_id, source_absence_id,
       original_date, scheduled_date, subject, status
from public.makeup_exams
order by created_at desc
limit 20;
```

Confirmar que no se consulte ni escriba información de otro tenant y que `authenticated` mantenga solo los privilegios de aplicación esperados.

## Rollback

- Si falla la UI: revertir el commit de frontend y redeployar la versión anterior.
- Si falla una inserción múltiple: no debe quedar una parte guardada; corregir el payload y repetir.
- No borrar filas existentes como parte del rollback.
- Si se necesita retirar una recuperación creada por error, hacerlo mediante el flujo autorizado de la aplicación o la política de eliminación vigente.

## Criterio de término

El cambio está listo cuando el flujo permite seleccionar curso, filtrar estudiantes, seleccionar dos o más pruebas, guardar las filas correspondientes y abrir correctamente una recuperación prellenada desde una inasistencia.
