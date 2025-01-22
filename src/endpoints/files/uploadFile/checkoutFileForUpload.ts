import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File} from '../../../definitions/file.js';
import {Folder} from '../../../definitions/folder.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {FileNotWritableError} from '../errors.js';
import {checkUploadFileAuth} from './auth.js';
import {beginCleanupExpiredMultipartUpload} from './multipart.js';
import {UploadFileEndpointParams} from './types.js';

async function checkFileWriteAvailable(params: {
  file: File;
  clientMultipartId: string | undefined;
  opts: SemanticProviderMutationParams;
}) {
  const {file, clientMultipartId, opts} = params;

  if (file.isWriteAvailable) {
    return;
  } else if (
    file.clientMultipartId &&
    file.clientMultipartId === clientMultipartId
  ) {
    return;
  } else if (file.multipartTimeout && file.multipartTimeout < Date.now()) {
    await beginCleanupExpiredMultipartUpload(file, opts);
    return;
  }

  throw new FileNotWritableError();
}

export async function checkoutFileForUpload(params: {
  agent: SessionAgent;
  workspace: Workspace;
  file: File;
  data: Pick<UploadFileEndpointParams, 'clientMultipartId'>;
  skipAuth?: boolean;
  opts: SemanticProviderMutationParams;
  closestExistingFolder?: Folder | null;
}) {
  const {agent, workspace, file, data, skipAuth, opts, closestExistingFolder} =
    params;

  await checkFileWriteAvailable({
    file,
    opts,
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

  return await kSemanticModels
    .file()
    .getAndUpdateOneById(
      file.resourceId,
      {isWriteAvailable: false, clientMultipartId: data.clientMultipartId},
      opts
    );
}
