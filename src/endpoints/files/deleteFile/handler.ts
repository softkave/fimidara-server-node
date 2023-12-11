import {AppResourceTypeMap, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {readAndCheckFileAuthorization} from '../utils';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async instData => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);
  const job = await kSemanticModels.utils().withTxn(async opts => {
    const file = await readAndCheckFileAuthorization(agent, data, 'deleteFile', opts);
    return await enqueueDeleteResourceJob(
      {
        type: AppResourceTypeMap.File,
        args: {
          workspaceId: file.workspaceId,
          fileIdList: [file.resourceId],
          files: [
            {
              resourceId: file.resourceId,
              namepath: file.namepath,
              extension: file.extension,
            },
          ],
        },
      },
      opts
    );
  });

  return {jobId: job.resourceId};
};

export default deleteFile;
