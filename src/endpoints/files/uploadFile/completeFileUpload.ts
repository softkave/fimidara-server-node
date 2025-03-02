import {size} from 'lodash-es';
import {appAssert} from '../../../utils/assertion.js';
import {getFileUpdate, completeUploadFile} from './update.js';
import {handleFinalStorageUsageRecords} from './usage.js';

export async function completeFileUpload() {
  await handleFinalStorageUsageRecords({
    reqData,
    file,
    isMultipart,
    size,
    isLastPart: data.isLastPart,
  });

  const update = getFileUpdate({
    agent,
    file,
    data,
    isMultipart,
    persistedMountData: pMountData,
    size,
    isLastPart: data.isLastPart,
  });

  appAssert(pMountData);
  file = await completeUploadFile({
    agent,
    file,
    primaryMount,
    pMountData,
    update,
    shouldInsertMountEntry: !isMultipart || !!data.isLastPart,
  });
}
