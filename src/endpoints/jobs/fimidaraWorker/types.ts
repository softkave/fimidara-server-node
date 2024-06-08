import {Job} from '../../../definitions/job.js';

export const kFimidaraWorkerMessageType = {
  getNextJobRequest: 'getNextJobRequest',
  getNextJobResponse: 'getNextJobResponse',
  stopWorker: 'stopWorker',
} as const;

export type FimidaraWorkerMessage =
  | {type: typeof kFimidaraWorkerMessageType.getNextJobRequest}
  | {type: typeof kFimidaraWorkerMessageType.getNextJobResponse; job?: Job}
  | {type: typeof kFimidaraWorkerMessageType.stopWorker};
