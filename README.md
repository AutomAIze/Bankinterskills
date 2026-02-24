# Plataforma RRHH 360

Aplicación React/Vite para gestión integrada de talento:
- selección y skills intelligence
- desempeño y potencial
- objetivos del bonus (M50)
- mapa de talento y sucesión
- acciones y recomendaciones de desarrollo

## Stack
- React + TypeScript + Vite
- Tailwind + shadcn-ui
- Supabase
- TanStack Query
- Vitest

## Puesta en marcha local

1. Instala dependencias:
```sh
npm install
```

2. Crea tu `.env` desde `.env.example` y configura:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- variables de branding `VITE_BRAND_*`

3. Ejecuta en local:
```sh
npm run dev
```

## Esquema RRHH

La extensión de datos RRHH está en:
- `supabase/migrations/20260224_120000_hr_360_schema.sql`

Incluye tablas de:
- evaluaciones y potencial
- objetivos bonus
- riesgo sucesorio
- acciones de desarrollo
- recomendaciones formativas
- trayectorias profesionales

## Integración batch (CSOD / Sopra / M50)

Desde `Admin` -> `Integración Batch RRHH`:
- preview de validación
- dry-run
- importación idempotente

Documentación:
- `docs/integration-templates.md`
- `docs/hr-data-dictionary.md`
- `docs/runbook-batch-import.md`

## Tests

```sh
npm run test
```
