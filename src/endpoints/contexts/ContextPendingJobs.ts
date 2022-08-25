import {
  throwRejectedPromisesWithId,
  waitOnPromisesWithId,
} from '../../utilities/waitOnPromises';
import RequestData from '../RequestData';
import {IRequestDataPendingPromise} from '../types';
import {IBaseContext} from './BaseContext';

export interface IContextPendingJobs {
  addJob: (
    reqData: RequestData,
    job: IRequestDataPendingPromise | Promise<any>
  ) => void;
  waitOnJobs: (ctx: IBaseContext) => Promise<void>;
}

function isRequestDataPendingPromise(
  job: IRequestDataPendingPromise | Promise<any>
): job is IRequestDataPendingPromise {
  return (job as IRequestDataPendingPromise).promise !== undefined;
}

export class ContextPendingJobs implements IContextPendingJobs {
  private jobs: Record<string, IRequestDataPendingPromise> = {};
  private disableJobsQueue = false;

  constructor(disableJobsQueue = false) {
    this.disableJobsQueue = disableJobsQueue;
  }

  addJob(reqData: RequestData, job: IRequestDataPendingPromise | Promise<any>) {
    if (isRequestDataPendingPromise(job)) {
      this._addJob(reqData, job);
    } else {
      this._addJob(reqData, {
        promise: job,
        id: Date.now(),
      });
    }
  }

  async waitOnJobs(ctx: IBaseContext) {
    throwRejectedPromisesWithId(ctx, await waitOnPromisesWithId(this.jobs));
  }

  private _addJob(reqData: RequestData, job: IRequestDataPendingPromise) {
    reqData.pendingPromises.push(job);
    if (!this.disableJobsQueue) {
      this.jobs[job.id] = job;
      job.promise.finally(() => {
        delete this.jobs[job.id];
      });
    }
  }
}
