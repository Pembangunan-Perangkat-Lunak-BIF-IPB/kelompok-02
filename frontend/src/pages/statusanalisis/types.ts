export type StepStatus = 'completed' | 'running' | 'queued' | 'failed';

export interface PipelineStep {
  id: number;
  key?: string;
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
  overallStatus?: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  estimatedTime: string; // e.g. "~2 Menit"
  currentPhaseName: string;
  syncIntervalSeconds: number;
  steps: PipelineStep[];
  isCompleted: boolean;
  isFailed?: boolean;
  errorMessage?: string | null;
}
