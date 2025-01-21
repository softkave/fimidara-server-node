import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File, FileMatcher} from '../../../definitions/file.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {FileNotWritableError} from '../errors.js';
import {getFileWithMatcher} from '../getFilesWithMatcher.js';
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
  } else if (file.clientMultipartId === clientMultipartId) {
    return;
  } else if (file.multipartTimeout && file.multipartTimeout > Date.now()) {
    await beginCleanupExpiredMultipartUpload(file, opts);
    return;
  }

  throw new FileNotWritableError();
}

export async function prepareExistingFile(params: {
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

export async function tryGetFile(
  data: FileMatcher & {workspaceId?: string},
  opts: SemanticProviderMutationParams
) {
  const matched = await getFileWithMatcher({
    opts,
    presignedPathAction: kFimidaraPermissionActions.uploadFile,
    incrementPresignedPathUsageCount: true,
    supportPresignedPath: true,
    matcher: data,
    workspaceId: data.workspaceId,
  });

  return matched;
}
