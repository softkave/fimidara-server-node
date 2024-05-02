import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables.js';
import {getTimestamp} from '../utils/dateFns.js';

export enum FimidaraScriptNames {
  AddThresholdToExistingWorkspaces = 'script_AddThresholdToExistingWorkspaces',
}

export interface IFimidaraScriptRunInfo {
  job: FimidaraScriptNames;
  runId: string | number;
}

export function scriptRunInfoFactory(
  opts: Pick<IFimidaraScriptRunInfo, 'job'>
): IFimidaraScriptRunInfo {
  return {job: opts.job, runId: getTimestamp()};
}

export function logScriptMessage(runInfo: IFimidaraScriptRunInfo, message: string) {
  kUtilsInjectables.logger().log(`script ${runInfo.job}: ${message}`);
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
    kUtilsInjectables.logger().error(error);
  }
}
