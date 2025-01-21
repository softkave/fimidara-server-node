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
  isNewFile: boolean;
}) {
  const {reqData, file, size, isNewFile} = params;
  if (!isNewFile) {
    await decrementStorageUsageRecord(reqData, file);
  }

  const fileWithSize = {...file, size, resourceId: undefined};
  await incrementBandwidthInUsageRecord(
    reqData,
    fileWithSize,
    kFimidaraPermissionActions.uploadFile
  );
  await incrementStorageEverConsumedUsageRecord(
    reqData,
    fileWithSize,
    kFimidaraPermissionActions.uploadFile
  );
}

export async function handleFinalStorageUsageRecords(params: {
  reqData: RequestData;
  file: File;
  size: number;
  isMultipart: boolean;
  isLastPart?: boolean;
}) {
  const {reqData, file, size, isMultipart, isLastPart} = params;
  const fileWithSize = {...file, size, resourceId: undefined};

  if (!isMultipart || isLastPart) {
    await incrementStorageUsageRecord(
      reqData,
      fileWithSize,
      kFimidaraPermissionActions.uploadFile
    );
  }
}
