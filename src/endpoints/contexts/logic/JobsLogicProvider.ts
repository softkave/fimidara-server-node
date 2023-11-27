import {Job, JobInput} from '../../../definitions/job';
import {AnyObject} from '../../../utils/types';

export class JobsLogicProvider {
  addJob: <TParams extends AnyObject = AnyObject>(
    input: JobInput<TParams>,
    parent?: Job
  ) => Promise<Job<TParams>>;
  addJobList: <TParams extends AnyObject = AnyObject>(
    inputList: JobInput<TParams>[],
    parent?: Job
  ) => Promise<Job<TParams>[]>;
  completeJob: <TJob extends Job = Job>(id: string) => Promise<TJob>;
  isJobComplete: (id: string, job?: Job) => Promise<boolean>;
  fetchImmediateChildren: <TJob extends Job = Job>(
    id: string,
    page: number,
    pageSize?: number
  ) => Promise<TJob[]>;
}
