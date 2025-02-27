import {JobStatus} from './job.js';
import {Resource} from './system.js';

export interface AppScript extends Resource {
  name: string;
  appId: string;
  uniqueId: string;
  status: JobStatus;
  statusLastUpdatedAt: number;
}
