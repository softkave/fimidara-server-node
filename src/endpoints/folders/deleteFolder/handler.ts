import {kAppResourceType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkFolderAuthorization02} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

const deleteFolder: DeleteFolderEndpoint = async instData => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);
  const {folder} = await checkFolderAuthorization02(agent, data, 'deleteFolder');

  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.Folder,
    args: {
      workspaceId: folder.workspaceId,
      resourceId: folder.resourceId,
      folder: {namepath: folder.namepath},
    },
  });

  return {jobId: job.resourceId};
};

export default deleteFolder;
