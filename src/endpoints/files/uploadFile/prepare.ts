import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File, FileMatcher} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {PresignedPath} from '../../../definitions/presignedPath.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {ValidationError} from '../../../utils/errors.js';
import {FileNotWritableError} from '../errors.js';
import {getFileWithMatcher} from '../getFilesWithMatcher.js';
import {
  FilepathInfo,
  assertFile,
  createNewFileAndEnsureFolders,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
} from '../utils.js';
import {checkUploadFileAuth} from './auth.js';
import {beginCleanupExpiredMultipartUpload} from './multipart.js';
import {UploadFileEndpointParams} from './types.js';

export async function createAndInsertNewFile(params: {
  agent: SessionAgent;
  workspace: Workspace;
  pathinfo: FilepathInfo;
  data: Pick<
    File,
    'description' | 'encoding' | 'mimetype' | 'clientMultipartId'
  >;
  opts: SemanticProviderMutationParams;
  seed?: Partial<File>;
}) {
  const {agent, workspace, pathinfo, data, opts, seed} = params;
  const {file, parentFolder} = await createNewFileAndEnsureFolders(
    agent,
    workspace,
    pathinfo,
    data,
    seed,
    /** parentFolder */ null
  );

  await kSemanticModels.file().insertItem(file, opts);
  return {file, parentFolder};
}

export async function checkFileWriteAvailable(params: {
  file: File;
  data: UploadFileEndpointParams;
  opts: SemanticProviderMutationParams;
}) {
  const {file, data, opts} = params;
  if (file.isWriteAvailable) {
    return;
  } else if (file.clientMultipartId === data.clientMultipartId) {
    return;
  } else if (file.multipartTimeout && file.multipartTimeout < Date.now()) {
    await beginCleanupExpiredMultipartUpload(file, opts);
    return;
  }

  throw new FileNotWritableError();
}

export async function prepareExistingFile(params: {
  agent: SessionAgent;
  workspace: Workspace;
  file: File;
  data: UploadFileEndpointParams;
  presignedPath: PresignedPath | undefined;
  opts: SemanticProviderMutationParams;
}) {
  const {agent, workspace, file, data, presignedPath, opts} = params;
  await checkFileWriteAvailable({file, data, opts});
  if (!presignedPath) {
    // Permission is already checked if there's a `presignedPath`
    await checkUploadFileAuth(
      agent,
      workspace,
      file,
      /** closestExistingFolder */ null,
      opts
    );
  }

  return await kSemanticModels
    .file()
    .getAndUpdateOneById(file.resourceId, {isWriteAvailable: false}, opts);
}

export async function prepareNewFile(params: {
  agent: SessionAgent;
  workspace: Workspace;
  data: UploadFileEndpointParams;
  opts: SemanticProviderMutationParams;
}) {
  const {agent, workspace, data, opts} = params;
  appAssert(
    data.filepath,
    new ValidationError('Provide a filepath for new files')
  );

  const pathinfo = getFilepathInfo(data.filepath, {
    containsRootname: true,
    allowRootFolder: false,
  });

  // it's safe (but a bit costly and confusing) to create parent folders and
  // file before checking auth. whatsoever queue and handler that's creating the
  // parent folders will fail if the user doesn't have permission to create
  // them. lastly, we're creating the file with a transaction, so if the auth
  // check fails, the transaction will be rolled back.
  const {file, parentFolder} = await createAndInsertNewFile({
    agent,
    workspace,
    pathinfo,
    data,
    opts,
  });

  await checkUploadFileAuth(agent, workspace, file, parentFolder, opts);
  return file;
}

export async function tryGetFile(
  data: FileMatcher,
  opts: SemanticProviderMutationParams
) {
  const matched = await getFileWithMatcher({
    presignedPathAction: kFimidaraPermissionActions.uploadFile,
    incrementPresignedPathUsageCount: true,
    supportPresignedPath: true,
    matcher: data,
    opts,
  });

  return matched;
}

export async function prepareFile(
  data: UploadFileEndpointParams,
  agent: SessionAgent
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const {file: existingFile, presignedPath} = await tryGetFile(data, opts);
    const workspace = await getWorkspaceFromFileOrFilepath(
      existingFile,
      data.filepath
    );

    let isNewFile: boolean,
      file = existingFile;

    if (file) {
      isNewFile = false;
      file = await prepareExistingFile({
        agent,
        workspace,
        file,
        data,
        presignedPath,
        opts,
      });
    } else {
      isNewFile = true;
      file = await prepareNewFile({agent, workspace, data, opts});
    }

    assertFile(file);
    return {file, workspace, isNewFile};
  });
}
