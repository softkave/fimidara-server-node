import {isObject} from 'lodash';
import {availableParallelism} from 'os';
import {App, kAppPresetShards, kAppType} from '../../definitions/app';
import {kAppResourceType} from '../../definitions/system';
import {newResource} from '../../utils/resource';
import {kSemanticModels} from '../contexts/injection/injectables';
import {
  BaseRunnerMessage,
  ChildRunnerWorkerData,
  RunnerWorkerMessage,
  kRunnerWorkerMessageTypeList,
} from './types';

export const kDefaultHeartbeatInterval = 5 * 60 * 1000; // 5 minutes
export const kDefaultActiveRunnerHeartbeatFactor = 2;
export const kDefaultRunnerCount = availableParallelism();
export const kEnsureRunnerCountPromiseName = 'runner_ensureRunnerCount';

export async function insertRunnerInDB(seed: Pick<App, 'resourceId'> & Partial<App>) {
  await kSemanticModels.utils().withTxn(opts =>
    kSemanticModels.app().insertItem(
      newResource<App>(kAppResourceType.App, {
        type: kAppType.runner,
        shard: kAppPresetShards.fimidaraMain,
        ...seed,
      }),
      opts
    )
  );
}

export function isBaseWorkerMessage(message: unknown): message is BaseRunnerMessage {
  return isObject(message);
}

export function isRunnerWorkerMessage(message: unknown): message is RunnerWorkerMessage {
  return (
    isBaseWorkerMessage(message) &&
    kRunnerWorkerMessageTypeList.includes((message as RunnerWorkerMessage).type)
  );
}

export function isChildRunnerWorkerData(data: unknown): data is ChildRunnerWorkerData {
  return isObject(data) && !!(data as ChildRunnerWorkerData).runnerId;
}
