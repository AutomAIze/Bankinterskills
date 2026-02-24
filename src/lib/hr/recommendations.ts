import type {
  DevelopmentAction,
  PerformanceEvaluation,
  PotentialAssessment,
} from "@/types/hr";

interface TrainingRecommendationInput {
  employeeId: string;
  employeeName: string;
  skillGapNames: string[];
  latestEvaluation: PerformanceEvaluation | null;
  potential: PotentialAssessment | null;
}

export interface TrainingRecommendation {
  employeeId: string;
  employeeName: string;
  title: string;
  reason: string;
  priority: "low" | "medium" | "high";
  suggestedActions: string[];
}

function buildSuggestedActions(skillGapNames: string[]): string[] {
  const fromSkills = skillGapNames.slice(0, 3).map((skill) => `Itinerario formativo en ${skill}`);
  if (!fromSkills.length) {
    return [
      "Mentoring con referente interno",
      "Plan de desarrollo trimestral con seguimiento mensual",
    ];
  }
  return fromSkills;
}

export function generateTrainingRecommendations(
  input: TrainingRecommendationInput[],
): TrainingRecommendation[] {
  return input
    .map((item) => {
      const evaluationScore = item.latestEvaluation?.normalizedScore ?? 0;
      const potentialScore = item.potential?.potentialScore ?? 0;
      const gapWeight = item.skillGapNames.length * 8;
      const priorityScore = Math.round((100 - evaluationScore) * 0.5 + gapWeight * 0.3 + potentialScore * 0.2);

      const priority: "low" | "medium" | "high" =
        priorityScore >= 65 ? "high" : priorityScore >= 40 ? "medium" : "low";

      const reasonParts = [
        item.latestEvaluation
          ? `Último desempeño: ${item.latestEvaluation.normalizedScore}/100`
          : "Sin evaluación reciente",
        item.potential
          ? `Potencial: ${item.potential.potentialLevel}`
          : "Potencial pendiente",
      ];

      if (item.skillGapNames.length) {
        reasonParts.push(`Gaps clave: ${item.skillGapNames.slice(0, 2).join(", ")}`);
      }

      return {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        title: `Plan de formación recomendado para ${item.employeeName}`,
        reason: reasonParts.join(" · "),
        priority,
        suggestedActions: buildSuggestedActions(item.skillGapNames),
      };
    })
    .sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.priority] - order[a.priority];
    });
}

export function recommendationsToDevelopmentActions(
  recommendations: TrainingRecommendation[],
): DevelopmentAction[] {
  const now = new Date().toISOString();
  return recommendations.map((rec, idx) => ({
    id: `auto-tr-${idx}-${rec.employeeId}`,
    employeeId: rec.employeeId,
    source: "automation",
    actionType: "training",
    title: rec.title,
    reason: rec.reason,
    priority: rec.priority,
    status: "pending",
    dueDate: null,
    createdAt: now,
  }));
}
