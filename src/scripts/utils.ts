import winston = require('winston');
import {getTimestamp} from '../utils/dateFns';
import {serverLogger} from '../utils/logger/loggerUtils';

export enum FimidaraScriptNames {
  AddThresholdToExistingWorkspaces = 'script_AddThresholdToExistingWorkspaces',
}

export interface IFimidaraScriptRunInfo {
  job: FimidaraScriptNames;
  runId: string | number;
  logger: winston.Logger;
}

export function scriptRunInfoFactory(
  opts: Pick<IFimidaraScriptRunInfo, 'job'>
): IFimidaraScriptRunInfo {
  return {
    job: opts.job,
    runId: getTimestamp(),
    logger: serverLogger,
  };
}

export function logScriptMessage(runInfo: IFimidaraScriptRunInfo, message: string) {
  runInfo.logger.info(`script ${runInfo.job}: ${message}`);
}

export function logScriptStarted(runInfo: IFimidaraScriptRunInfo) {
  logScriptMessage(runInfo, 'started');
}

export function logScriptSuccessful(runInfo: IFimidaraScriptRunInfo) {
  logScriptMessage(runInfo, 'succeeded');
}

export function logScriptFailed(runInfo: IFimidaraScriptRunInfo, error?: Error) {
  logScriptMessage(runInfo, 'failed');
  if (error) {
    runInfo.logger.error(error);
  }
}
