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
  /** Usually follows after `getActiveRunnerIds`, it's a message containing a
   * list of active runner IDs used by children threads to request unfinished
   * jobs from DB. */
  setActiveRunnerIds: 'setActiveRunnerIds',
  /** Instrument the parent thread to send it's list of active runners to the
   * requesting child thread. */
  getActiveRunnerIds: 'getActiveRunnerIds',
  /** Ack message, letting the sender know the message has been received. An ack
   * message itself should not have an ack message. */
  ack: 'ack',
  /** Instruments the worker thread to fail, primarily used for testing. */
  fail: 'fail',
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
    | {
        type: typeof kRunnerWorkerMessageType.fail;
      }
  );
