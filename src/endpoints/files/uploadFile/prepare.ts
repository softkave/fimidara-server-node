import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {FileWithRuntimeData} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {InvalidStateError} from '../../errors.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {getWorkspaceFromFileOrFilepath} from '../utils.js';
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';
import {checkoutFileForUpload} from './checkoutFileForUpload.js';
import {fireAndForgetHandleMultipartCleanup} from './multipart.js';
import {queueAddInternalMultipartId} from './queueAddInternalMultipartId.js';
import {queuePrepareFile} from './queuePrepareFile.js';
import {UploadFileEndpointParams} from './types.js';
import {tryGetFile} from './utils.js';

export async function prepareFileForUpload(
  data: Pick<
    UploadFileEndpointParams,
    'filepath' | 'clientMultipartId' | 'fileId'
  >,
  agent: SessionAgent
) {
  const firstAttempt = await kIjxSemantic.utils().withTxn(async opts => {
    const {file: existingFile, presignedPath} = await tryGetFile(data, opts);
    const workspace = await getWorkspaceFromFileOrFilepath(
      existingFile,
      data.filepath
    );

    if (existingFile) {
      const file = await checkoutFileForUpload({
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
  const file = await queuePrepareFile({
    agent,
    input: {
      workspace,
      data,
    },
  });

  return {file, workspace, isNewFile: true};
}

export async function prepareMultipart(params: {
  file: FileWithRuntimeData;
  agent: SessionAgent;
}) {
  const {agent, file} = params;
  appAssert(
    !file.internalMultipartId,
    new InvalidStateError('File is already in a multipart upload')
  );

  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs({
    file,
    initPrimaryBackendOnly: true,
  });

  const filepath = await prepareMountFilepath({primaryMount, file});
  const {multipartId} = await queueAddInternalMultipartId({
    agent,
    input: {
      filepath,
      fileId: file.resourceId,
      workspaceId: file.workspaceId,
      mount: {
        backend: primaryMount.backend,
        namepath: primaryMount.namepath,
        resourceId: primaryMount.resourceId,
        mountedFrom: primaryMount.mountedFrom,
      },
      namepath: file.namepath,
    },
  });

  file.internalMultipartId = multipartId;
  fireAndForgetHandleMultipartCleanup({
    primaryBackend,
    primaryMount,
    filepath,
    file: file as FileWithRuntimeData,
  });

  return file;
}
