import {omit} from 'lodash';
import {BasicCRUDActions, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {objectHasData} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {addPublicPermissionGroupAccessOps} from '../../permissionItems/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {makeFilePublicAccessOps} from '../uploadFile/accessOps';
import {checkFileAuthorization03, fileExtractor} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

/**
 * TODO:
 * - [Medium] Implement name and path update
 */

const updateFileDetails: UpdateFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let {file} = await checkFileAuthorization03(context, agent, data, BasicCRUDActions.Update);

  if (objectHasData(omit(data.file, 'tags'))) {
    file = await context.semantic.file.getAndUpdateOneById(file.resourceId, {
      ...data.file,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    });
  }

  const workspace = await context.semantic.workspace.getOneById(file.workspaceId);
  assertWorkspace(workspace);
  if (data.file.publicAccessAction) {
    const publicAccessOps = makeFilePublicAccessOps(agent, data.file.publicAccessAction);
    await addPublicPermissionGroupAccessOps(context, agent, workspace, publicAccessOps, file);
  }

  await saveResourceAssignedItems(context, agent, workspace, file.resourceId, data.file, true);
  file = await populateAssignedTags(context, file.workspaceId, file);
  return {
    file: fileExtractor(file),
  };
};

export default updateFileDetails;
