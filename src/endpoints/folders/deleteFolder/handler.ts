import {AppResourceTypeMap, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kSemanticModels} from '../../contexts/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {checkFolderAuthorization02} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

const deleteFolder: DeleteFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {folder} = await checkFolderAuthorization02(agent, data, 'deleteFolder');

  const job = await kSemanticModels.utils().withTxn(opts =>
    enqueueDeleteResourceJob(
      {
        type: AppResourceTypeMap.Folder,
        args: {workspaceId: folder.workspaceId, resourceId: folder.resourceId},
      },
      opts
    )
  );

  return {jobId: job.resourceId};
};

export default deleteFolder;
