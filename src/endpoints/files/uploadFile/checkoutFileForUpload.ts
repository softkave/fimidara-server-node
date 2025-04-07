import {merge, pick} from 'lodash-es';
import {UnionToTuple} from 'type-fest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File, FileWithRuntimeData} from '../../../definitions/file.js';
import {Folder} from '../../../definitions/folder.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getCleanupMultipartFileUpdate} from '../deleteFile/deleteMultipartUpload.js';
import {FileNotWritableError} from '../errors.js';
import {checkUploadFileAuth} from './auth.js';
import {beginCleanupExpiredMultipartUpload} from './multipart.js';
import {UploadFileEndpointParams} from './types.js';

async function checkFileWriteAvailable(params: {
  file: File;
  clientMultipartId: string | undefined;
}) {
  const {file, clientMultipartId} = params;
  if (file.isWriteAvailable) {
    return;
  } else if (
    file.clientMultipartId &&
    file.clientMultipartId === clientMultipartId
  ) {
    return;
  } else if (file.multipartTimeout && file.multipartTimeout < Date.now()) {
    await beginCleanupExpiredMultipartUpload(file);
    return;
  }

  throw new FileNotWritableError();
}

export async function checkoutFileForUpload(params: {
  agent: SessionAgent;
  workspace: Workspace;
  file: FileWithRuntimeData;
  data: Pick<UploadFileEndpointParams, 'clientMultipartId'>;
  skipAuth?: boolean;
  opts: SemanticProviderMutationParams;
  closestExistingFolder?: Folder | null;
}) {
  const {agent, workspace, file, data, skipAuth, opts, closestExistingFolder} =
    params;

  await checkFileWriteAvailable({
    file,
    clientMultipartId: data.clientMultipartId,
  });

  if (!skipAuth) {
    await checkUploadFileAuth(
      agent,
      workspace,
      file,
      closestExistingFolder || null,
      opts
    );
  }

  const updatedFile = await kIjxSemantic.file().getAndUpdateOneById(
    file.resourceId,
    {
      ...(file.RUNTIME_ONLY_shouldCleanupMultipart
        ? getCleanupMultipartFileUpdate()
        : {}),
      isWriteAvailable: false,
      clientMultipartId: data.clientMultipartId,
    },
    opts
  );

  const runtimeProps: UnionToTuple<
    Exclude<keyof FileWithRuntimeData, keyof File>
  > = [
    'RUNTIME_ONLY_shouldCleanupMultipart',
    'RUNTIME_ONLY_internalMultipartId',
  ];

  return merge(updatedFile, pick(file, runtimeProps));
}
