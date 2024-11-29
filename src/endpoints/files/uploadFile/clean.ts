import {isNumber, isString} from 'lodash-es';
import {FilePersistenceProvider} from '../../../contexts/file/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File, FileWithRuntimeData} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {appAssert} from '../../../utils/assertion.js';
import {mergeData} from '../../../utils/fns.js';
import {deletePartMetas} from '../utils/partMeta.js';

export function getCleanupMultipartFileUpdate(): Partial<File> {
  return {
    isWriteAvailable: true,
    partLength: null,
    uploadedParts: null,
    internalMultipartId: null,
    clientMultipartId: null,
    multipartTimeout: null,
    uploadedSize: null,
  };
}

export async function cleanupMultipartUpload(
  file: File,
  opts: SemanticProviderMutationParams
) {
  const update = getCleanupMultipartFileUpdate();
  appAssert(isNumber(file.partLength));
  appAssert(isString(file.internalMultipartId));
  await kSemanticModels.file().updateOneById(file.resourceId, update, opts);
  kUtilsInjectables.promises().forget(
    deletePartMetas({
      multipartId: file.internalMultipartId,
      partLength: file.partLength,
    })
  );

  (file as FileWithRuntimeData).RUNTIME_ONLY_shouldCleanupMultipart = true;
  (file as FileWithRuntimeData).RUNTIME_ONLY_internalMultipartId =
    file.internalMultipartId;
  (file as FileWithRuntimeData).RUNTIME_ONLY_partLength = file.partLength;
  mergeData(file, update);
}

export function handleMultipartCleanup(params: {
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
    appAssert(isNumber(file.RUNTIME_ONLY_partLength));
    kUtilsInjectables.promises().forget(
      primaryBackend.cleanupMultipartUpload({
        filepath,
        fileId: file.resourceId,
        multipartId: file.RUNTIME_ONLY_internalMultipartId,
        mount: primaryMount,
        partLength: file.RUNTIME_ONLY_partLength,
        workspaceId: file.workspaceId,
      })
    );
  }
}
