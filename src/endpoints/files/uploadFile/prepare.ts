import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SessionAgent} from '../../../definitions/system.js';
import {getWorkspaceFromFileOrFilepath} from '../utils.js';
import {checkoutFileForUpload} from './checkoutFileForUpload.js';
import {queuePrepareFile} from './queuePrepareFile.js';
import {UploadFileEndpointParams} from './types.js';
import {tryGetFile} from './utils.js';

export async function prepareFileForUpload(
  data: UploadFileEndpointParams,
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
