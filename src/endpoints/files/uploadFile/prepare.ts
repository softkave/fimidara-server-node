import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File, FileMatcher} from '../../../definitions/file.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {createOrRetrieve} from '../../../utils/concurrency/createOrRetrieve.js';
import {ValidationError} from '../../../utils/errors.js';
import {FileNotWritableError} from '../errors.js';
import {getFileWithMatcher} from '../getFilesWithMatcher.js';
import {
  FilepathInfo,
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
  data: UploadFileEndpointParams;
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

export async function prepareNewFile(params: {
  agent: SessionAgent;
  workspace: Workspace;
  data: UploadFileEndpointParams;
}) {
  const {agent, workspace, data} = params;
  appAssert(
    data.filepath,
    new ValidationError('Provide a filepath for new files')
  );

  const pathinfo = getFilepathInfo(data.filepath, {
    containsRootname: true,
    allowRootFolder: false,
  });

  const key = `upload-prepare-file-${data.filepath}`;
  const file = await createOrRetrieve<File | undefined>({
    key,
    _debug: {
      clientMultipartId: data.clientMultipartId,
      part: data.part,
    },
    create: async () => {
      return await kSemanticModels.utils().withTxn(async opts => {
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

        const preparedFile = await prepareExistingFile({
          agent,
          workspace,
          file,
          data,
          opts,
          closestExistingFolder: parentFolder,
          skipAuth: false,
        });

        appAssert(preparedFile);
        return preparedFile;
      });
    },
    retrieve: async () => {
      return await kSemanticModels.utils().withTxn(async opts => {
        const {file} = await tryGetFile(
          {...data, workspaceId: workspace.resourceId},
          opts
        );

        if (file) {
          appAssert(file);
          const preparedFile = await prepareExistingFile({
            agent,
            workspace,
            file,
            data,
            opts,
            skipAuth: false,
          });

          appAssert(preparedFile);
          return preparedFile;
        }

        return undefined;
      });
    },
    durationMs: 1000, // 1 second
  });

  appAssert(file);
  return file;
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

export async function prepareFile(
  data: UploadFileEndpointParams,
  agent: SessionAgent
) {
  const firstAttempt = await kSemanticModels.utils().withTxn(async opts => {
    const {file: existingFile, presignedPath} = await tryGetFile(data, opts);
    const workspace = await getWorkspaceFromFileOrFilepath(
      existingFile,
      data.filepath
    );

    if (existingFile) {
      const file = await prepareExistingFile({
        agent,
        workspace,
        data,
        opts,
        // Permission is already checked if there's a `presignedPath`
        skipAuth: !!presignedPath,
        file: existingFile,
      });

      return {file, workspace};
    }

    return {workspace, file: undefined};
  });

  if (firstAttempt.file) {
    return {...firstAttempt, isNewFile: false, file: firstAttempt.file};
  }

  const {workspace} = firstAttempt;
  const file = await prepareNewFile({agent, workspace, data});
  return {file, workspace, isNewFile: true};
}
