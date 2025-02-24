import {isNumber, isString} from 'lodash-es';
import {FilePersistenceProvider} from '../../../contexts/file/types.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {appAssert} from '../../../utils/assertion.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {deleteMultipartUploadPartMetas} from '../utils/multipartUploadMeta.js';
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';

export function getCleanupMultipartFileUpdate(): Partial<File> {
  return {
    isWriteAvailable: true,
    multipartId: null,
    multipartTimeout: null,
  };
}

export async function deleteMultipartUpload(props: {
  file: File;
  primaryBackend?: FilePersistenceProvider;
  primaryMount?: FileBackendMount;
  backendFilepath?: string;
  multipartId?: string;
  shouldCleanupFile?: boolean;
  part?: number;
}) {
  const {file, multipartId, shouldCleanupFile, part} = props;
  let {primaryBackend, primaryMount, backendFilepath: filepath} = props;

  if (!primaryBackend || !primaryMount) {
    ({primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
      file,
      /** initPrimaryBackendOnly */ true
    ));
  }

  if (!filepath) {
    filepath = await prepareMountFilepath({primaryMount, file});
  }

  const multipartIdToUse = multipartId ?? file.multipartId;
  appAssert(isString(multipartIdToUse));
  await Promise.all([
    isNumber(part)
      ? primaryBackend.deleteMultipartUploadPart({
          part,
          filepath,
          fileId: file.resourceId,
          multipartId: multipartIdToUse,
          mount: primaryMount,
          workspaceId: file.workspaceId,
        })
      : primaryBackend.cleanupMultipartUpload({
          filepath,
          fileId: file.resourceId,
          multipartId: multipartIdToUse,
          mount: primaryMount,
          workspaceId: file.workspaceId,
        }),
    deleteMultipartUploadPartMetas({
      part,
      multipartId: multipartIdToUse,
    }),
    shouldCleanupFile && !isNumber(part)
      ? kSemanticModels.utils().withTxn(opts => {
          return kSemanticModels
            .file()
            .updateOneById(
              file.resourceId,
              getCleanupMultipartFileUpdate(),
              opts
            );
        })
      : Promise.resolve(),
  ]);
}
