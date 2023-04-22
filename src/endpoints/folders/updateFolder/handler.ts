import {omit} from 'lodash';
import {Folder} from '../../../definitions/folder';
import {AppActionType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {checkFolderAuthorization02, folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let folder = await executeWithMutationRunOptions(context, async opts => {
    let {workspace, folder} = await checkFolderAuthorization02(
      context,
      agent,
      data,
      AppActionType.Update,
      /** workspace */ undefined,
      opts
    );
    const update: Partial<Folder> = {
      ...omit(data.folder, 'publicAccessOps'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    folder = await context.semantic.folder.getAndUpdateOneById(folder.resourceId, update, opts);
    return folder;
  });
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {folder: folderExtractor(folder!)};
};

export default updateFolder;
