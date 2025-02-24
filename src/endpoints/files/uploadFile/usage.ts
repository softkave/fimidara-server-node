import {
  decrementStorageUsageRecord,
  incrementBandwidthInUsageRecord,
  incrementStorageEverConsumedUsageRecord,
  incrementStorageUsageRecord,
} from '../../../contexts/usage/usageFns.js';
import {File} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import RequestData from '../../RequestData.js';

export async function handleIntermediateStorageUsageRecords(params: {
  reqData: RequestData;
  file: File;
  size: number;
}) {
  const {reqData, file, size} = params;

  // TODO: why is resourceId undefined?
  const fileWithSize = {...file, size, resourceId: undefined};
  await Promise.all([
    incrementBandwidthInUsageRecord(
      reqData,
      fileWithSize,
      kFimidaraPermissionActions.uploadFile
    ),
    incrementStorageEverConsumedUsageRecord(
      reqData,
      fileWithSize,
      kFimidaraPermissionActions.uploadFile
    ),
  ]);
}

export async function handleFinalStorageUsageRecords(params: {
  reqData: RequestData;
  file: File;
  size: number;
}) {
  const {reqData, file, size} = params;

  if (file.size) {
    await decrementStorageUsageRecord(reqData, file);
  }

  const fileWithSize = {...file, size, resourceId: undefined};
  await incrementStorageUsageRecord(
    reqData,
    fileWithSize,
    kFimidaraPermissionActions.uploadFile
  );
}
