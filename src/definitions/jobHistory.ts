import {JobStatus} from './job.js';
import {Resource} from './system.js';

export interface JobHistory extends Resource {
  jobId: string;
  status: JobStatus;
  runnerId?: string;
  workspaceId?: string;
  errorMessage?: string;
}
