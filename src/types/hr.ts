export type DataSource = "CSOD" | "SOPRA" | "M50";

export type EvaluationType = "annual" | "mid_year" | "quarterly" | "ad_hoc";

export type PotentialLevel = "low" | "medium" | "high";

export type SuccessionReadiness = "ready_now" | "ready_1y" | "ready_2y" | "not_ready";

export type RiskLevel = "low" | "medium" | "high";

export interface Employee {
  id: string;
  externalId: string | null;
  fullName: string;
  email: string | null;
  businessUnit: string | null;
  department: string | null;
  position: string | null;
  managerId: string | null;
  active: boolean;
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  source: DataSource;
  cycle: string;
  evaluationType: EvaluationType;
  score: number;
  normalizedScore: number;
  qualitativeNotes: string | null;
  evaluator: string | null;
  evaluatedAt: string;
}

export interface PotentialAssessment {
  id: string;
  employeeId: string;
  source: DataSource;
  cycle: string;
  potentialLevel: PotentialLevel;
  potentialScore: number;
  readiness: SuccessionReadiness;
  rationale: string | null;
  assessedAt: string;
}

export interface BonusObjective {
  id: string;
  employeeId: string;
  source: "M50";
  cycle: string;
  objectiveCode: string;
  objectiveName: string;
  weight: number;
  targetValue: number | null;
  progressValue: number | null;
  status: "not_started" | "on_track" | "at_risk" | "completed";
  dueDate: string | null;
  importedAt: string;
}

export interface DevelopmentAction {
  id: string;
  employeeId: string;
  source: "automation" | DataSource;
  actionType: "training" | "mentoring" | "rotation" | "succession";
  title: string;
  reason: string;
  priority: RiskLevel;
  status: "pending" | "in_progress" | "completed";
  dueDate: string | null;
  createdAt: string;
}

export interface SuccessionRiskSnapshot {
  id: string;
  positionId: string;
  positionName: string;
  businessUnit: string;
  riskLevel: RiskLevel;
  readinessCoverage: number;
  benchSize: number;
  snapshotDate: string;
}

export interface CareerPathStep {
  id: string;
  pathCode: string;
  fromRole: string;
  toRole: string;
  minReadinessScore: number;
  requiredSkills: string[];
}

export interface IntegratedTalentKpi {
  totalEmployees: number;
  evaluatedEmployees: number;
  sustainedPerformanceRate: number;
  highPotentialRate: number;
  successionRiskHighCount: number;
  developmentActionsPending: number;
  bonusObjectivesOnTrackRate: number;
  trainingRecommendationCount: number;
}
