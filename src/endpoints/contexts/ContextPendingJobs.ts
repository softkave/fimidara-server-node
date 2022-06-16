import {
  throwRejectedPromisesWithId,
  waitOnPromisesWithId,
} from '../../utilities/waitOnPromises';
import RequestData from '../RequestData';
import {IRequestDataPendingPromise} from '../types';

export interface IContextPendingJobs {
  addJob: (
    reqData: RequestData,
    job: IRequestDataPendingPromise | Promise<any>
  ) => void;
  waitOnJobs: () => Promise<void>;
}

function isRequestDataPendingPromise(
  job: IRequestDataPendingPromise | Promise<any>
): job is IRequestDataPendingPromise {
  return (job as IRequestDataPendingPromise).promise !== undefined;
}

export class ContextPendingJobs implements IContextPendingJobs {
  private jobs: Record<string, IRequestDataPendingPromise> = {};
  private disableJobsQueue: boolean = false;

  constructor(disableJobsQueue: boolean = false) {
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

  async waitOnJobs() {
    throwRejectedPromisesWithId(await waitOnPromisesWithId(this.jobs));
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
