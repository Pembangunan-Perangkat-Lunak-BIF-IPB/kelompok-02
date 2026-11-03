export type StepStatus = 'completed' | 'running' | 'queued';

export interface PipelineStep {
  id: number;
  title: string;
  status: StepStatus;
  duration?: string;
  details?: string;
  iteration?: string;
  progressPercent?: number; // 0 - 100 for running step
}

export interface PipelineAnalysisState {
  resultId: string;
  overallProgress: number; // e.g. 22, 48, 89, 100
  estimatedTime: string; // e.g. "~2 Menit"
  currentPhaseName: string;
  syncIntervalSeconds: number;
  steps: PipelineStep[];
  isCompleted: boolean;
}

