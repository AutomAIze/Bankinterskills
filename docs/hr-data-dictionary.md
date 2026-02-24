# Diccionario de Datos RRHH 360

## Tablas de integración y auditoría

### `hr_import_batches`
- Traza cada carga batch por fuente (`CSOD`, `SOPRA`, `M50`).
- Métricas de proceso: `total_rows`, `valid_rows`, `error_rows`, `status`.

### `hr_import_errors`
- Errores por fila para cada lote.
- Incluye `error_code`, `error_message` y `raw_payload`.

## Core de personas y evaluación

### `hr_employees`
- Maestro consolidado de empleados.
- Claves: `id`, `external_id`, `business_unit`, `department`, `position`, `manager_id`.

### `performance_evaluations`
- Histórico de desempeño por persona/ciclo.
- Campos clave: `evaluation_type`, `score`, `normalized_score`, `evaluated_at`.

### `potential_assessments`
- Histórico de potencial y readiness.
- Campos clave: `potential_level`, `potential_score`, `readiness`, `assessed_at`.

## Objetivos, sucesión y desarrollo

### `bonus_objectives`
- Objetivos importados desde M50.
- Campos clave: `objective_code`, `objective_name`, `weight`, `progress_value`, `status`, `cycle`.

### `hr_succession_risk_snapshots`
- Snapshots de riesgo sucesorio por posición crítica.
- Campos clave: `risk_level`, `readiness_coverage`, `bench_size`, `snapshot_date`.

### `hr_development_actions`
- Acciones automáticas o manuales de desarrollo.
- Campos clave: `action_type`, `priority`, `status`, `reason`.

### `hr_training_recommendations`
- Recomendaciones de formación generadas a partir de desempeño/potencial/gaps.

### `hr_career_paths`
- Definición de trayectorias profesionales.
- Campos clave: `path_code`, `from_role`, `to_role`, `min_readiness_score`, `required_skills`.

## Vistas de BI

### `hr_integrated_talent_dashboard_v`
- Vista 360 por persona: desempeño sostenido, potencial/readiness, objetivos y acciones.
- Fuente principal del dashboard integrado.

### `hr_succession_dashboard_v`
- Agregado por unidad de negocio para control de riesgo sucesorio.
