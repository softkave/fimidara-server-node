import {isString} from 'lodash-es';
import {FilePersistenceProvider} from '../../../contexts/file/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File, FileWithRuntimeData} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {appAssert} from '../../../utils/assertion.js';
import {mergeData} from '../../../utils/fns.js';
import {
  deleteMultipartUpload,
  getCleanupMultipartFileUpdate,
} from '../deleteFile/deleteMultipartUpload.js';
import {completeFileUpload} from './completeFileUpload.js';

export async function beginCleanupExpiredMultipartUpload(
  file: File,
  opts: SemanticProviderMutationParams
) {
  const update = getCleanupMultipartFileUpdate();
  appAssert(isString(file.internalMultipartId));
  await kIjxSemantic.file().updateOneById(file.resourceId, update, opts);

  (file as FileWithRuntimeData).RUNTIME_ONLY_shouldCleanupMultipart = true;
  (file as FileWithRuntimeData).RUNTIME_ONLY_internalMultipartId =
    file.internalMultipartId;

  mergeData(file, update);
}

export function fireAndForgetHandleMultipartCleanup(params: {
  file: FileWithRuntimeData;
  primaryBackend: FilePersistenceProvider;
  primaryMount: FileBackendMount;
  filepath: string;
}) {
  // TODO: this should be moved to a background job
  const {file, primaryBackend, primaryMount, filepath} = params;
  if (file.RUNTIME_ONLY_shouldCleanupMultipart) {
    file.RUNTIME_ONLY_shouldCleanupMultipart = false;
    appAssert(isString(file.RUNTIME_ONLY_internalMultipartId));
    kIjxUtils.promises().callAndForget(() =>
      deleteMultipartUpload({
        file,
        primaryBackend,
        primaryMount,
        mountFilepath: filepath,
        multipartId: file.RUNTIME_ONLY_internalMultipartId!,
        // we don't want to cleanup the file here, because we've done that
        // already, and there's a chance a different multipart upload is going
        // on
        shouldCleanupFile: false,
      })
    );
  }
}

export async function handleLastMultipartUpload(params: {
  file: File;
  primaryBackend: FilePersistenceProvider;
  primaryMount: FileBackendMount;
  mountFilepath: string;
  partNumsToUse: Array<{part: number}>;
  requestId: string;
}) {
  const {
    file,
    primaryBackend,
    primaryMount,
    mountFilepath,
    partNumsToUse,
    requestId,
  } = params;
  appAssert(isString(file.clientMultipartId));
  appAssert(isString(file.internalMultipartId));

  const parts = await kIjxSemantic.filePart().getManyByMultipartIdAndPart({
    multipartId: file.internalMultipartId,
    part: partNumsToUse.map(p => p.part),
  });

  const pMountData = await primaryBackend.completeMultipartUpload({
    parts,
    filepath: mountFilepath,
    fileId: file.resourceId,
    multipartId: file.internalMultipartId,
    mount: primaryMount,
    workspaceId: file.workspaceId,
  });

  kIjxUtils.promises().callAndForget(() =>
    kIjxSemantic.filePart().deleteManyByMultipartIdAndPart({
      multipartId: file.internalMultipartId!,
    })
  );

  const size = parts.reduce((acc, part) => acc + part.size, 0);
  await completeFileUpload({
    file,
    data: {},
    primaryMount,
    persistedMountData: pMountData,
    requestId,
    agent: file.createdBy,
    size,
  });
}
