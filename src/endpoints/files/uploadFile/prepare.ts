import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getWorkspaceFromFileOrFilepath} from '../utils.js';
import {prepareExistingFile, tryGetFile} from './prepareExistingFile.js';
import {queuePrepareFile} from './queuePrepareFile.js';
import {UploadFileEndpointParams} from './types.js';

export async function prepareNewFile(params: {
  agent: SessionAgent;
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>;
  data: Pick<
    UploadFileEndpointParams,
    'filepath' | 'clientMultipartId' | 'part'
  >;
}) {
  const {agent, workspace, data} = params;
  const file = await queuePrepareFile({
    agent,
    input: {
      workspace,
      data,
    },
  });

  return file;
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
