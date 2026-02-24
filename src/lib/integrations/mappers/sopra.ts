import type { Employee } from "@/types/hr";

interface SopraMapOptions {
  activeByDefault?: boolean;
}

export function mapSopraRows(
  rows: Array<{ rowNumber: number; raw: Record<string, string> }>,
  options: SopraMapOptions = {},
): { employees: Employee[]; errors: string[] } {
  const employees: Employee[] = [];
  const errors: string[] = [];

  const activeByDefault = options.activeByDefault ?? true;

  for (const row of rows) {
    const employeeId = row.raw.employee_id?.trim();
    const fullName = row.raw.full_name?.trim();

    if (!employeeId || !fullName) {
      errors.push(`Fila ${row.rowNumber}: faltan employee_id o full_name`);
      continue;
    }

    employees.push({
      id: employeeId,
      externalId: row.raw.external_id || null,
      fullName,
      email: row.raw.email || null,
      businessUnit: row.raw.business_unit || null,
      department: row.raw.department || null,
      position: row.raw.position || null,
      managerId: row.raw.manager_id || null,
      active: row.raw.active ? row.raw.active.toLowerCase() !== "false" : activeByDefault,
    });
  }

  return { employees, errors };
}
