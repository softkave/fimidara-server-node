import {FileWithRuntimeData} from '../../../definitions/file.js';
import {deleteAck} from '../../../utils/concurrency/createOrRetrieve.js';
import {UploadFileEndpointParams} from './types.js';

export async function cleanupConcurrencyKeys(params: {
  file: FileWithRuntimeData;
  data: UploadFileEndpointParams;
}) {
  const {file, data} = params;
  const key01 = `upload-prepare-file-${data.filepath}`;
  const key02 = `upload-multipart-file-${file.resourceId}`;

  await Promise.all([deleteAck(key01), deleteAck(key02)]);
}
