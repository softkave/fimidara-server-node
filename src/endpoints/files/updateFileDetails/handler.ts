import {omit} from 'lodash';
import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {objectHasData} from '../../../utilities/fns';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {replacePublicPermissionGroupAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import {assertWorkspace} from '../../workspaces/utils';
import FileQueries from '../queries';
import {makeFilePublicAccessOps} from '../uploadFile/accessOps';
import {checkFileAuthorization03, fileExtractor} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

/**
 * TODO:
 * - [Medium] Implement name and path update
 */

const updateFileDetails: UpdateFileDetailsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  let {file} = await checkFileAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Update
  );

  if (objectHasData(omit(data.file, 'tags'))) {
    file = await context.data.file.assertUpdateItem(
      FileQueries.getById(file.resourceId),
      {
        ...data.file,
        lastUpdatedAt: getDateString(),
        lastUpdatedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      }
    );
  }

  const workspace = await context.cacheProviders.workspace.getById(
    context,
    file.workspaceId
  );

  assertWorkspace(workspace);
  if (data.file.publicAccessAction) {
    const publicAccessOps = makeFilePublicAccessOps(
      agent,
      data.file.publicAccessAction
    );

    await replacePublicPermissionGroupAccessOpsByPermissionOwner(
      context,
      agent,
      workspace,
      file.resourceId,
      AppResourceType.File,
      publicAccessOps,
      file.resourceId
    );
  }

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    file.resourceId,
    AppResourceType.File,
    data.file,
    true
  );

  file = await populateAssignedPermissionGroupsAndTags(
    context,
    file.workspaceId,
    file,
    AppResourceType.File
  );

  return {
    file: fileExtractor(file),
  };
};

export default updateFileDetails;
