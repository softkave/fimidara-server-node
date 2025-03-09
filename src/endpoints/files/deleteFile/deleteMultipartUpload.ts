import {isNumber, isString} from 'lodash-es';
import {FilePersistenceProvider} from '../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {File} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {appAssert} from '../../../utils/assertion.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';

export function getCleanupMultipartFileUpdate(): Partial<File> {
  return {
    isWriteAvailable: true,
    internalMultipartId: null,
    clientMultipartId: null,
    multipartTimeout: null,
  };
}

export async function deleteMultipartUpload(props: {
  file: File;
  primaryBackend?: FilePersistenceProvider;
  primaryMount?: FileBackendMount;
  filepath?: string;
  multipartId?: string;
  shouldCleanupFile?: boolean;
  part?: number;
}) {
  const {file, multipartId, shouldCleanupFile, part} = props;
  let {primaryBackend, primaryMount, filepath} = props;

  if (!primaryBackend || !primaryMount) {
    ({primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs({
      file,
      initPrimaryBackendOnly: true,
    }));
  }

  if (!filepath) {
    filepath = await prepareMountFilepath({primaryMount, file});
  }

  const multipartIdToUse = multipartId ?? file.internalMultipartId;
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
    kIjxSemantic.filePart().deleteManyByMultipartIdAndPart({
      multipartId: multipartIdToUse,
      part,
    }),
    shouldCleanupFile && !isNumber(part)
      ? kIjxSemantic.utils().withTxn(opts => {
          return kIjxSemantic
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
