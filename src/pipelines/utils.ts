import winston = require('winston');
import {getTimestamp} from '../utils/dateFns';
import {serverLogger} from '../utils/logger/loggerUtils';

export enum FimidaraPipelineNames {
  AggregateUsageRecordsJob = 'aggregateUsageRecordsJob',
  UnlockWorkspaceLocksJob = 'unlockWorkspaceLocksJob',
}

export interface IFimidaraPipelineRunInfo {
  job: FimidaraPipelineNames;
  runId: string | number;
  logger: winston.Logger;
}

export function pipelineRunInfoFactory(
  opts: Pick<IFimidaraPipelineRunInfo, 'job'>
): IFimidaraPipelineRunInfo {
  return {
    job: opts.job,
    runId: getTimestamp(),
    logger: serverLogger,
  };
}
