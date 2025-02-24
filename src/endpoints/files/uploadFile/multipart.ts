import {isString} from 'lodash-es';
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
import {
  deleteMultipartUpload,
  getCleanupMultipartFileUpdate,
} from '../deleteFile/deleteMultipartUpload.js';

export async function beginCleanupExpiredMultipartUpload(
  file: File,
  opts: SemanticProviderMutationParams
) {
  const update = getCleanupMultipartFileUpdate();
  appAssert(isString(file.multipartId));
  await kSemanticModels.file().updateOneById(file.resourceId, update, opts);

  (file as FileWithRuntimeData).RUNTIME_ONLY_shouldCleanupMultipart = true;
  (file as FileWithRuntimeData).RUNTIME_ONLY_shouldCleanupMultipartId =
    file.multipartId;

  mergeData(file, update);
}

export function fireAndForgetHandleMultipartCleanup(params: {
  file: FileWithRuntimeData;
  primaryBackend: FilePersistenceProvider;
  primaryMount: FileBackendMount;
  backendFilepath: string;
}) {
  // TODO: this should be moved to a background job
  const {file, primaryBackend, primaryMount, backendFilepath} = params;

  if (file.RUNTIME_ONLY_shouldCleanupMultipart) {
    file.RUNTIME_ONLY_shouldCleanupMultipart = false;
    appAssert(isString(file.RUNTIME_ONLY_shouldCleanupMultipartId));
    const cleanupMultipartId = file.RUNTIME_ONLY_shouldCleanupMultipartId;
    kUtilsInjectables.promises().callAndForget(() =>
      deleteMultipartUpload({
        file,
        primaryBackend,
        primaryMount,
        backendFilepath,
        multipartId: cleanupMultipartId,
        // we don't want to cleanup the file here, because we've done that
        // already, and there's a chance a different multipart upload is going
        // on
        shouldCleanupFile: false,
      })
    );
  }
}
