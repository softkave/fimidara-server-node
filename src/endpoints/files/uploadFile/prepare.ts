import {FileWithRuntimeData} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {InvalidStateError} from '../../errors.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {getWorkspaceIdByMatcher} from '../utils/getWorkspaceIdByMatcher.js';
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';
import {fireAndForgetHandleMultipartCleanup} from './multipart.js';
import {queueAddInternalMultipartId} from './queueAddInternalMultipartId.js';
import {queuePrepareFile} from './queuePrepareFile.js';
import {UploadFileEndpointParams} from './types.js';

export async function cleanupStaleMultipartUpload(params: {
  file: FileWithRuntimeData;
}) {
  const {file} = params;
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs({
    file,
    initPrimaryBackendOnly: true,
  });

  const mountFilepath = await prepareMountFilepath({primaryMount, file});
  fireAndForgetHandleMultipartCleanup({
    primaryBackend,
    primaryMount,
    mountFilepath,
    file: file as FileWithRuntimeData,
  });

  return {mountFilepath, primaryBackend, primaryMount};
}

export async function prepareFileForUpload(params: {
  data: Pick<
    UploadFileEndpointParams,
    'filepath' | 'clientMultipartId' | 'fileId'
  >;
  agent: SessionAgent;
}) {
  const {data, agent} = params;
  const workspaceId = await getWorkspaceIdByMatcher(data);
  const file = await queuePrepareFile({
    agent,
    input: {...data, workspaceId},
  });

  const {mountFilepath, primaryBackend, primaryMount} =
    await cleanupStaleMultipartUpload({file});

  return {
    file,
    mountFilepath,
    primaryBackend,
    primaryMount,
  };
}

export async function prepareMultipart(params: {
  file: FileWithRuntimeData;
  agent: SessionAgent;
  clientMultipartId: string;
  primaryMount: FileBackendMount;
  mountFilepath: string;
}) {
  const {agent, file, clientMultipartId, primaryMount, mountFilepath} = params;
  appAssert(
    !file.internalMultipartId,
    new InvalidStateError('File is already in a multipart upload')
  );

  const {multipartId} = await queueAddInternalMultipartId({
    agent,
    input: {
      mountFilepath,
      clientMultipartId,
      fileId: file.resourceId,
      workspaceId: file.workspaceId,
      namepath: file.namepath,
      mount: {
        backend: primaryMount.backend,
        namepath: primaryMount.namepath,
        resourceId: primaryMount.resourceId,
        mountedFrom: primaryMount.mountedFrom,
      },
    },
  });

  file.internalMultipartId = multipartId;
  return file;
}
