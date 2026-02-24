-- Datos sintéticos para demo HR 360
-- Se insertan en la base de datos; la app siempre consulta Supabase.
-- Idempotente: usar ON CONFLICT para poder re-ejecutar.

-- Empleados sintéticos
INSERT INTO public.hr_employees (id, full_name, business_unit, department, position, manager_id, active)
VALUES
  ('emp-001', 'Elena Martín Vega', 'Banca Comercial', 'Red Comercial Madrid', 'Directora de Oficina', null, true),
  ('emp-002', 'Carlos Ruiz Hernández', 'Banca Comercial', 'Red Comercial Madrid', 'Gestor Comercial', 'emp-001', true),
  ('emp-003', 'Ana García López', 'Banca Comercial', 'Red Comercial Cataluña', 'Gestor Comercial', 'emp-001', true),
  ('emp-004', 'Miguel Torres Díaz', 'Banca Comercial', 'Red Comercial Andalucía', 'Gestor Comercial', 'emp-001', true),
  ('emp-005', 'Laura Fernández Soto', 'Banca Privada', 'Patrimonio', 'Gestor Banca Privada', null, true),
  ('emp-006', 'David Sánchez Navarro', 'Banca Privada', 'Patrimonio', 'Gestor Banca Privada', null, true),
  ('emp-007', 'Patricia Moreno Ruiz', 'Banca Privada', 'HNWI', 'Director Banca Privada', null, true),
  ('emp-008', 'Javier Ortega Gil', 'Riesgos', 'Riesgo Crediticio', 'Analista de Riesgos', null, true),
  ('emp-009', 'Isabel Ramos Peña', 'Riesgos', 'Riesgo Crediticio', 'Analista de Riesgos', null, true),
  ('emp-010', 'Roberto Jiménez Castro', 'Riesgos', 'Riesgo Operacional', 'Responsable de Riesgos', null, true),
  ('emp-011', 'Marta Delgado Prieto', 'Tecnología', 'Desarrollo', 'Developer', null, true),
  ('emp-012', 'Fernando Blanco Reyes', 'Tecnología', 'Desarrollo', 'Developer', null, true),
  ('emp-013', 'Cristina López Aranda', 'Tecnología', 'Arquitectura', 'Tech Lead', null, true),
  ('emp-014', 'Alejandro Muñoz Serrano', 'Tecnología', 'Producto Digital', 'Business Analyst', null, true),
  ('emp-015', 'Beatriz Herrera Molina', 'Tecnología', 'Producto Digital', 'Product Owner', null, true),
  ('emp-016', 'Raúl Campos Vargas', 'Personas', 'Talento', 'HR Business Partner', null, true),
  ('emp-017', 'Sofía Navarro Díez', 'Personas', 'Formación', 'Responsable de Formación', null, true),
  ('emp-018', 'Antonio Vidal Romero', 'Operaciones', 'Back Office', 'Responsable Operaciones', null, true),
  ('emp-019', 'Carmen Iglesias Luna', 'Operaciones', 'Cumplimiento', 'Compliance Officer', null, true),
  ('emp-020', 'Pablo Medina Fuentes', 'Banca Comercial', 'Red Comercial País Vasco', 'Gestor Comercial', 'emp-001', true),
  ('emp-021', 'Lucía Romero Cabrera', 'Banca Comercial', 'Empresas', 'Gestor Banca Empresa', null, true),
  ('emp-022', 'Daniel Guerrero Peña', 'Riesgos', 'Modelos', 'Analista de Riesgos', 'emp-010', true),
  ('emp-023', 'Adriana Varela Santos', 'Tecnología', 'Data', 'Data Engineer', 'emp-013', true),
  ('emp-024', 'Marcos Ibáñez Cano', 'Banca Privada', 'Inversiones', 'Gestor Banca Privada', 'emp-007', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  business_unit = EXCLUDED.business_unit,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  manager_id = EXCLUDED.manager_id,
  updated_at = now();

-- Evaluaciones de desempeño (CSOD)
INSERT INTO public.performance_evaluations (id, employee_id, source, cycle, evaluation_type, score, normalized_score, qualitative_notes, evaluator, evaluated_at)
SELECT
  'eval-' || t.emp_id || '-' || t.cycle,
  t.emp_id,
  'CSOD',
  t.cycle,
  CASE WHEN t.ord = 2 THEN 'mid_year'::text ELSE 'annual'::text END,
  t.score,
  t.score,
  CASE WHEN t.score >= 85 THEN 'Rendimiento sobresaliente' WHEN t.score >= 75 THEN 'Cumple sólidamente' WHEN t.score >= 65 THEN 'Adecuado con áreas de mejora' ELSE 'Necesita refuerzo' END,
  COALESCE((SELECT manager_id FROM public.hr_employees WHERE id = t.emp_id), 'Comité'),
  CASE t.cycle WHEN '2024-H1' THEN '2024-06-15'::date WHEN '2024-H2' THEN '2024-12-15'::date WHEN '2025-H1' THEN '2025-06-15'::date ELSE '2025-06-15'::date END
FROM (VALUES
  ('emp-001', '2024-H1', 1, 88), ('emp-001', '2024-H2', 2, 91), ('emp-001', '2025-H1', 3, 90),
  ('emp-002', '2024-H1', 1, 72), ('emp-002', '2024-H2', 2, 68), ('emp-002', '2025-H1', 3, 74),
  ('emp-003', '2024-H1', 1, 85), ('emp-003', '2024-H2', 2, 87), ('emp-003', '2025-H1', 3, 89),
  ('emp-004', '2024-H1', 1, 60), ('emp-004', '2024-H2', 2, 63), ('emp-004', '2025-H1', 3, 58),
  ('emp-005', '2024-H1', 1, 92), ('emp-005', '2024-H2', 2, 94), ('emp-005', '2025-H1', 3, 93),
  ('emp-006', '2024-H1', 1, 78), ('emp-006', '2024-H2', 2, 75), ('emp-006', '2025-H1', 3, 80),
  ('emp-007', '2024-H1', 1, 95), ('emp-007', '2024-H2', 2, 93), ('emp-007', '2025-H1', 3, 96),
  ('emp-008', '2024-H1', 1, 70), ('emp-008', '2024-H2', 2, 72), ('emp-008', '2025-H1', 3, 76),
  ('emp-009', '2024-H1', 1, 82), ('emp-009', '2024-H2', 2, 84), ('emp-009', '2025-H1', 3, 81),
  ('emp-010', '2024-H1', 1, 88), ('emp-010', '2024-H2', 2, 86), ('emp-010', '2025-H1', 3, 90),
  ('emp-011', '2024-H1', 1, 65), ('emp-011', '2024-H2', 2, 70), ('emp-011', '2025-H1', 3, 73),
  ('emp-012', '2024-H1', 1, 80), ('emp-012', '2024-H2', 2, 82), ('emp-012', '2025-H1', 3, 85),
  ('emp-013', '2024-H1', 1, 90), ('emp-013', '2024-H2', 2, 92), ('emp-013', '2025-H1', 3, 91),
  ('emp-014', '2024-H1', 1, 68), ('emp-014', '2024-H2', 2, 72), ('emp-014', '2025-H1', 3, 75),
  ('emp-015', '2024-H1', 1, 85), ('emp-015', '2024-H2', 2, 88), ('emp-015', '2025-H1', 3, 86),
  ('emp-016', '2024-H1', 1, 78), ('emp-016', '2024-H2', 2, 80), ('emp-016', '2025-H1', 3, 82),
  ('emp-017', '2024-H1', 1, 84), ('emp-017', '2024-H2', 2, 82), ('emp-017', '2025-H1', 3, 86),
  ('emp-018', '2024-H1', 1, 76), ('emp-018', '2024-H2', 2, 74), ('emp-018', '2025-H1', 3, 78),
  ('emp-019', '2024-H1', 1, 90), ('emp-019', '2024-H2', 2, 88), ('emp-019', '2025-H1', 3, 92),
  ('emp-020', '2024-H1', 1, 55), ('emp-020', '2024-H2', 2, 60), ('emp-020', '2025-H1', 3, 62),
  ('emp-021', '2024-H1', 1, 82), ('emp-021', '2024-H2', 2, 85), ('emp-021', '2025-H1', 3, 87),
  ('emp-022', '2024-H1', 1, 74), ('emp-022', '2024-H2', 2, 78), ('emp-022', '2025-H1', 3, 76),
  ('emp-023', '2024-H1', 1, 86), ('emp-023', '2024-H2', 2, 88), ('emp-023', '2025-H1', 3, 90),
  ('emp-024', '2024-H1', 1, 70), ('emp-024', '2024-H2', 2, 72), ('emp-024', '2025-H1', 3, 68)
) AS t(emp_id, cycle, ord, score)
WHERE EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = t.emp_id)
ON CONFLICT (id) DO UPDATE SET
  normalized_score = EXCLUDED.normalized_score,
  qualitative_notes = EXCLUDED.qualitative_notes;

-- Potencial (SOPRA)
INSERT INTO public.potential_assessments (id, employee_id, source, cycle, potential_level, potential_score, readiness, rationale, assessed_at)
VALUES
  ('pot-001', 'emp-001', 'SOPRA', '2025-H1', 'high', 88, 'ready_now', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-002', 'emp-002', 'SOPRA', '2025-H1', 'medium', 55, 'ready_2y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-003', 'emp-003', 'SOPRA', '2025-H1', 'high', 82, 'ready_1y', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-004', 'emp-004', 'SOPRA', '2025-H1', 'low', 35, 'not_ready', 'Consolidar competencias actuales', '2025-06-30'),
  ('pot-005', 'emp-005', 'SOPRA', '2025-H1', 'high', 90, 'ready_now', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-006', 'emp-006', 'SOPRA', '2025-H1', 'medium', 60, 'ready_1y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-007', 'emp-007', 'SOPRA', '2025-H1', 'high', 95, 'ready_now', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-008', 'emp-008', 'SOPRA', '2025-H1', 'medium', 62, 'ready_2y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-009', 'emp-009', 'SOPRA', '2025-H1', 'high', 78, 'ready_1y', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-010', 'emp-010', 'SOPRA', '2025-H1', 'high', 85, 'ready_now', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-011', 'emp-011', 'SOPRA', '2025-H1', 'medium', 58, 'ready_2y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-012', 'emp-012', 'SOPRA', '2025-H1', 'high', 76, 'ready_1y', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-013', 'emp-013', 'SOPRA', '2025-H1', 'high', 92, 'ready_now', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-014', 'emp-014', 'SOPRA', '2025-H1', 'medium', 64, 'ready_1y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-015', 'emp-015', 'SOPRA', '2025-H1', 'high', 84, 'ready_now', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-016', 'emp-016', 'SOPRA', '2025-H1', 'medium', 68, 'ready_1y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-017', 'emp-017', 'SOPRA', '2025-H1', 'high', 80, 'ready_1y', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-018', 'emp-018', 'SOPRA', '2025-H1', 'medium', 56, 'ready_2y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-019', 'emp-019', 'SOPRA', '2025-H1', 'high', 86, 'ready_now', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-020', 'emp-020', 'SOPRA', '2025-H1', 'low', 38, 'not_ready', 'Consolidar competencias actuales', '2025-06-30'),
  ('pot-021', 'emp-021', 'SOPRA', '2025-H1', 'high', 79, 'ready_1y', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-022', 'emp-022', 'SOPRA', '2025-H1', 'medium', 65, 'ready_2y', 'Desarrollo adicional necesario', '2025-06-30'),
  ('pot-023', 'emp-023', 'SOPRA', '2025-H1', 'high', 83, 'ready_1y', 'Capacidad para responsabilidades superiores', '2025-06-30'),
  ('pot-024', 'emp-024', 'SOPRA', '2025-H1', 'medium', 52, 'ready_2y', 'Desarrollo adicional necesario', '2025-06-30')
ON CONFLICT (id) DO UPDATE SET
  potential_level = EXCLUDED.potential_level,
  potential_score = EXCLUDED.potential_score,
  readiness = EXCLUDED.readiness;

-- Objetivos bonus (M50)
INSERT INTO public.bonus_objectives (id, employee_id, source, cycle, objective_code, objective_name, weight, target_value, progress_value, status, due_date, imported_at)
VALUES
  ('obj-001', 'emp-001', 'M50', '2025', 'OBJ-COM', 'Captación neta de clientes', 30, 100, 88, 'on_track', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-002', 'emp-001', 'M50', '2025', 'OBJ-REN', 'Margen de intermediación', 25, 100, 75, 'on_track', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-003', 'emp-002', 'M50', '2025', 'OBJ-COM', 'Captación neta de clientes', 30, 100, 45, 'at_risk', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-004', 'emp-003', 'M50', '2025', 'OBJ-SAT', 'NPS Satisfacción cliente', 20, 100, 92, 'completed', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-005', 'emp-004', 'M50', '2025', 'OBJ-COM', 'Captación neta de clientes', 30, 100, 28, 'at_risk', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-006', 'emp-005', 'M50', '2025', 'OBJ-REN', 'Margen de intermediación', 25, 100, 90, 'on_track', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-007', 'emp-006', 'M50', '2025', 'OBJ-DIG', 'Índice venta digital', 15, 100, 65, 'on_track', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-008', 'emp-007', 'M50', '2025', 'OBJ-COMP', 'Cumplimiento normativo', 10, 100, 100, 'completed', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-009', 'emp-008', 'M50', '2025', 'OBJ-COM', 'Captación neta de clientes', 30, 100, 55, 'at_risk', '2025-12-31', '2025-03-01 10:00:00+00'),
  ('obj-010', 'emp-009', 'M50', '2025', 'OBJ-REN', 'Margen de intermediación', 25, 100, 82, 'on_track', '2025-12-31', '2025-03-01 10:00:00+00')
ON CONFLICT (id) DO UPDATE SET progress_value = EXCLUDED.progress_value, status = EXCLUDED.status;

-- Acciones de desarrollo
INSERT INTO public.hr_development_actions (id, employee_id, source, action_type, title, reason, priority, status, due_date, created_at)
VALUES
  ('act-001', 'emp-002', 'automation', 'training', 'Certificación MiFID II avanzada', 'Gap normativo para trayectoria a Director de Oficina', 'high', 'in_progress', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-002', 'emp-003', 'automation', 'mentoring', 'Mentoring con Directora de Oficina', 'Preparación sucesión Red Cataluña', 'high', 'in_progress', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-003', 'emp-004', 'automation', 'training', 'Programa refuerzo técnicas de venta consultiva', 'Desempeño bajo umbral sostenido', 'high', 'pending', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-004', 'emp-008', 'automation', 'training', 'Máster gestión avanzada riesgo crediticio', 'Gap para rol Responsable de Riesgos', 'medium', 'pending', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-005', 'emp-009', 'automation', 'rotation', 'Rotación a Riesgo Operacional (6 meses)', 'Ampliar bench · potencial alto', 'medium', 'pending', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-006', 'emp-011', 'automation', 'training', 'Certificación Cloud Architecture', 'Skill gap para Tech Lead', 'medium', 'in_progress', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-007', 'emp-012', 'automation', 'mentoring', 'Pair programming con Tech Lead', 'Perfil high potential', 'medium', 'in_progress', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-008', 'emp-014', 'automation', 'training', 'Product Management Fundamentals', 'Gap para Product Owner', 'medium', 'pending', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-009', 'emp-020', 'automation', 'training', 'Programa intensivo habilidades comerciales', 'Rendimiento bajo umbral mínimo', 'high', 'pending', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-010', 'emp-005', 'automation', 'succession', 'Plan sucesión Director Banca Privada', 'Candidata preferente', 'low', 'completed', '2025-06-30', '2025-03-15 09:00:00+00'),
  ('act-011', 'emp-021', 'automation', 'training', 'Programa Banca Empresa avanzado', 'Desarrollo skill análisis balances', 'medium', 'in_progress', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-012', 'emp-023', 'automation', 'training', 'Certificación Data Engineering', 'Skill gap para Data Lead', 'medium', 'pending', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-013', 'emp-006', 'automation', 'rotation', 'Asignación temporal a HNWI', 'Ampliar experiencia grandes patrimonios', 'low', 'completed', '2025-06-30', '2025-03-15 09:00:00+00'),
  ('act-014', 'emp-016', 'automation', 'training', 'Certificación People Analytics', 'Reforzar competencia analítica HR', 'low', 'in_progress', '2025-12-31', '2025-03-15 09:00:00+00'),
  ('act-015', 'UNASSIGNED', 'automation', 'succession', 'Cobertura sucesoria urgente: Director Banca Privada', 'Riesgo alto · cobertura 35% · bench 2', 'high', 'pending', null, '2025-03-15 09:00:00+00'),
  ('act-016', 'UNASSIGNED', 'automation', 'succession', 'Cobertura sucesoria urgente: Responsable de Riesgos', 'Riesgo alto · cobertura 45% · bench 2', 'high', 'pending', null, '2025-03-15 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Riesgo sucesorio
INSERT INTO public.hr_succession_risk_snapshots (id, position_id, position_name, business_unit, risk_level, readiness_coverage, bench_size, snapshot_date)
VALUES
  ('sr-001', 'pos-001', 'Director Banca Privada', 'Banca Privada', 'high', 35, 2, '2025-06-30'),
  ('sr-002', 'pos-002', 'Responsable de Riesgos', 'Riesgos', 'high', 45, 2, '2025-06-30'),
  ('sr-003', 'pos-003', 'Tech Lead', 'Tecnología', 'medium', 60, 3, '2025-06-30'),
  ('sr-004', 'pos-004', 'Directora de Oficina Madrid', 'Banca Comercial', 'medium', 55, 2, '2025-06-30'),
  ('sr-005', 'pos-005', 'Product Owner Digital', 'Tecnología', 'low', 80, 4, '2025-06-30'),
  ('sr-006', 'pos-006', 'Compliance Officer', 'Operaciones', 'high', 25, 1, '2025-06-30'),
  ('sr-007', 'pos-007', 'Responsable de Formación', 'Personas', 'low', 70, 3, '2025-06-30'),
  ('sr-008', 'pos-008', 'Director Banca Empresa', 'Banca Comercial', 'medium', 50, 2, '2025-06-30')
ON CONFLICT (id) DO NOTHING;

-- Trayectorias profesionales (índice único para idempotencia)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_career_paths_path_code ON public.hr_career_paths(path_code);

INSERT INTO public.hr_career_paths (path_code, from_role, to_role, min_readiness_score, required_skills)
VALUES
  ('COM-01', 'Gestor Comercial', 'Director de Oficina', 75, ARRAY['Liderazgo de equipos','Gestión de P&L','MiFID II avanzado','Venta consultiva']),
  ('PRI-01', 'Gestor Banca Privada', 'Director Banca Privada', 80, ARRAY['Gestión de grandes patrimonios','Planificación fiscal','Relación institucional','MiFID II avanzado']),
  ('RSK-01', 'Analista de Riesgos', 'Responsable de Riesgos', 70, ARRAY['Análisis crediticio avanzado','Modelos de scoring','Normativa Basilea III/IV','Gestión de equipos']),
  ('TEC-01', 'Developer', 'Tech Lead', 72, ARRAY['Cloud Architecture','System Design','Code Review avanzado','Mentoring técnico']),
  ('TEC-02', 'Business Analyst', 'Product Owner', 68, ARRAY['Product Strategy','Métricas de producto','User Research','Agile avanzado']),
  ('COM-02', 'Gestor Banca Empresa', 'Director Banca Empresa', 78, ARRAY['Estructuración financiera','Análisis de balances','Negociación corporativa','Gestión de cartera']),
  ('TEC-03', 'Data Engineer', 'Data Lead', 70, ARRAY['MLOps','Data Governance','Spark avanzado','Liderazgo técnico']),
  ('HR-01', 'HR Business Partner', 'Director de Personas', 80, ARRAY['People Analytics','Compensación y beneficios','Relaciones laborales','Diseño organizativo'])
ON CONFLICT (path_code) DO UPDATE SET
  from_role = EXCLUDED.from_role,
  to_role = EXCLUDED.to_role,
  min_readiness_score = EXCLUDED.min_readiness_score,
  required_skills = EXCLUDED.required_skills;
