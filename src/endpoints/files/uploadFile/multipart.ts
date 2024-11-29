import {isNumber, isString} from 'lodash-es';
import {FilePersistenceProvider} from '../../../contexts/file/types.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {appAssert} from '../../../utils/assertion.js';
import {deletePartMetas, hasPartMeta} from '../utils/partMeta.js';

export async function handleLastMultipartUpload(params: {
  file: File;
  primaryBackend: FilePersistenceProvider;
  primaryMount: FileBackendMount;
  filepath: string;
}) {
  const {file, primaryBackend, primaryMount, filepath} = params;
  appAssert(isString(file.clientMultipartId));
  appAssert(isNumber(file.partLength));
  appAssert(isString(file.internalMultipartId));
  await primaryBackend.completeMultipartUpload({
    filepath,
    fileId: file.resourceId,
    multipartId: file.clientMultipartId,
    mount: primaryMount,
    partLength: file.partLength,
    workspaceId: file.workspaceId,
  });

  kUtilsInjectables.promises().forget(
    deletePartMetas({
      multipartId: file.internalMultipartId,
      partLength: file.partLength,
    })
  );
}

export async function getExistingFilePartMeta(params: {
  file: File;
  part?: number;
}) {
  const {file, part} = params;
  return isNumber(part) && isString(file.internalMultipartId)
    ? hasPartMeta({multipartId: file.internalMultipartId, part: part})
    : ({} as Awaited<ReturnType<typeof hasPartMeta>>);
}
