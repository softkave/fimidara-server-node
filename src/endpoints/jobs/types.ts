import {ExportedHttpEndpoint} from '../types';
import {GetJobStatusEndpoint} from './getJobStatus/types';

export interface LongRunningJobResult {
  jobId: string;
}

export type JobsExportedEndpoints = {
  getJobStatus: ExportedHttpEndpoint<GetJobStatusEndpoint>;
};
