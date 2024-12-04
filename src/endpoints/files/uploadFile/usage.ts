import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import RequestData from '../../RequestData.js';
import {
  decrementStorageUsageRecord,
  incrementBandwidthInUsageRecord,
  incrementStorageEverConsumedUsageRecord,
  incrementStorageUsageRecord,
} from '../../usageRecords/usageFns.js';

export async function handleStorageUsageRecords(params: {
  reqData: RequestData;
  file: File;
  size: number;
  isNewFile: boolean;
  isMultipart: boolean;
  isLastPart?: boolean;
}) {
  const {reqData, file, size, isNewFile, isMultipart, isLastPart} = params;
  if (!isNewFile) {
    kUtilsInjectables
      .promises()
      .forget(decrementStorageUsageRecord(reqData, file));
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

  if (!isMultipart || isLastPart) {
    await incrementStorageUsageRecord(
      reqData,
      fileWithSize,
      kFimidaraPermissionActions.uploadFile
    );
  }
}
