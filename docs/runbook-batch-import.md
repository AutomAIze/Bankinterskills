# Runbook de Carga y Reproceso (Batch RRHH)

## 0) Datos sintéticos (demo)
Para entornos de demostración sin datos reales, ejecuta la migración de seed:
```bash
supabase db push
# o aplicar manualmente: supabase/migrations/20260224_150000_hr_synthetic_seed.sql
```
Inserta 24 empleados, evaluaciones, potencial, objetivos bonus, acciones de desarrollo, riesgo sucesorio y trayectorias profesionales. La app siempre consulta la base de datos; no hay fallback en memoria.

## 1) Preparación
- Verifica `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Confirma que el esquema RRHH está migrado (`supabase/migrations/20260224_120000_hr_360_schema.sql`).
- Revisa plantillas en `docs/integration-templates.md`.

## 2) Carga inicial
1. Ir a `Admin` -> sección `Integración Batch RRHH`.
2. Seleccionar fuente (`CSOD`, `SOPRA`, `M50`) y `ciclo`.
3. Cargar archivo.
4. Ejecutar `Preview validación` y corregir errores.
5. Ejecutar `dry-run` para validar upserts esperados.
6. Desactivar `dry-run` y ejecutar importación final.

## 3) Verificaciones post-carga
- Revisar métricas en `Skills Intelligence` (cuadro integrado).
- Comprobar módulos:
  - `Desempeño y Potencial`
  - `Mapa de Talento`
  - `Objetivos Bonus`
  - `Planes de Desarrollo`
- Ejecutar automatizaciones y revisar acciones generadas.

## 4) Reproceso
- Si falla una carga:
  - corregir fuente
  - relanzar con mismo ciclo
  - el upsert idempotente evita duplicados
- Si hay datos inconsistentes:
  - cargar lote de corrección solo con filas afectadas
  - volver a ejecutar automatizaciones

## 5) Operación recomendada
- Frecuencia sugerida:
  - CSOD: semanal/quincenal
  - Sopra: diaria o cuando cambie el maestro
  - M50: semanal en ciclo activo
- Registrar en bitácora interna:
  - fecha/hora
  - fuente
  - filas procesadas
  - incidencias
