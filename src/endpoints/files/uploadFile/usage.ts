import {
  decrementStorageUsageRecord,
  incrementBandwidthInUsageRecord,
  incrementStorageEverConsumedUsageRecord,
  incrementStorageUsageRecord,
} from '../../../contexts/usage/usageFns.js';
import {File} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Agent} from '../../../definitions/system.js';

export async function handleIntermediateStorageUsageRecords(params: {
  requestId: string;
  agent: Agent;
  file: File;
  size: number;
}) {
  const {requestId, agent, file, size} = params;

  // TODO: why is resourceId undefined?
  const fileWithSize = {...file, size, resourceId: undefined};
  await Promise.all([
    incrementBandwidthInUsageRecord({
      requestId,
      agent,
      file: fileWithSize,
      action: kFimidaraPermissionActions.uploadFile,
    }),
    incrementStorageEverConsumedUsageRecord({
      requestId,
      agent,
      file: fileWithSize,
      action: kFimidaraPermissionActions.uploadFile,
    }),
  ]);
}

export async function handleFinalStorageUsageRecords(params: {
  requestId: string;
  agent: Agent;
  file: File;
  size: number;
}) {
  const {requestId, agent, file, size} = params;
  const fileWithSize = {...file, size, resourceId: undefined};

  await decrementStorageUsageRecord({agent, file});
  await incrementStorageUsageRecord({
    requestId,
    agent,
    file: fileWithSize,
    action: kFimidaraPermissionActions.uploadFile,
  });
}
