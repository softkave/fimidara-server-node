import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {GetJobStatusEndpoint} from './getJobStatus/types';

export interface LongRunningJobResult {
  jobId?: string;
}

export type GetJobStatusHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetJobStatusEndpoint>;

export type JobsExportedEndpoints = {
  getJobStatus: GetJobStatusHttpEndpoint;
};

export const kRunnerWorkerMessageType = {
  setActiveRunnerIds: 'setActiveRunnerIds',
  getActiveRunnerIds: 'getActiveRunnerIds',
  ack: 'ack',
} as const;
export const kRunnerWorkerMessageTypeList = Object.values(kRunnerWorkerMessageType);

export interface ChildRunnerWorkerData {
  runnerId: string;
}

export interface BaseRunnerMessage {
  messageId?: string | number;
  /** `null` if message was sent from parent/main thread. */
  runnerId: string | null;
}

export type RunnerWorkerMessage = BaseRunnerMessage &
  (
    | {
        type: typeof kRunnerWorkerMessageType.setActiveRunnerIds;
        activeRunnerIds: string[];
      }
    | {
        type: typeof kRunnerWorkerMessageType.getActiveRunnerIds;
      }
    | {
        type: typeof kRunnerWorkerMessageType.ack;
      }
  );
