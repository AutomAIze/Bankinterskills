# Plantillas de Integración Batch (CSOD · Sopra · M50)

## Reglas generales
- Formato admitido: CSV, TSV o TXT delimitado.
- Primera fila obligatoria: cabeceras.
- Codificación recomendada: UTF-8.
- Las cargas son idempotentes por `id` lógico generado por fuente/ciclo.

## CSOD (evaluaciones + potencial)

### Columnas mínimas
- `employee_id`
- `performance_score`
- `potential_score`

### Columnas opcionales
- `evaluated_at`
- `assessed_at`
- `qualitative_notes`
- `potential_rationale`
- `evaluator`

### Ejemplo
```csv
employee_id,performance_score,potential_score,evaluated_at,assessed_at,qualitative_notes,evaluator
E001,82,76,2026-01-31,2026-01-31,"Desempeño sólido en objetivos críticos","Manager A"
E002,68,72,2026-01-31,2026-01-31,"Necesita reforzar liderazgo transversal","Manager B"
```

## Sopra (maestro de empleados)

### Columnas mínimas
- `employee_id`
- `full_name`

### Columnas opcionales
- `external_id`
- `email`
- `business_unit`
- `department`
- `position`
- `manager_id`
- `active`

### Ejemplo
```csv
employee_id,full_name,email,business_unit,department,position,manager_id,active
E001,Ana Pérez,ana.perez@cliente.com,Retail,Comercial,Manager Comercial,E900,true
E002,Luis Martín,luis.martin@cliente.com,Riesgos,Análisis,Analista Senior,E901,true
```

## M50 (objetivos bonus)

### Columnas mínimas
- `employee_id`
- `objective_code`
- `objective_name`
- `weight`

### Columnas opcionales
- `target_value`
- `progress_value`
- `status` (`not_started` | `on_track` | `at_risk` | `completed`)
- `due_date`
- `imported_at`

### Ejemplo
```csv
employee_id,objective_code,objective_name,weight,target_value,progress_value,status,due_date
E001,OBJ-01,Incrementar conversión segmento premium,35,100,64,on_track,2026-12-31
E002,OBJ-09,Reducir incidencias operativas críticas,40,100,42,at_risk,2026-12-31
```
