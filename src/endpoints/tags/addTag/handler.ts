import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {AddTagEndpoint} from './types';
import {addTagJoiSchema} from './validation';
import {tagExtractor} from '../utils';
import {checkTagNameExists} from '../checkTagNameExists';

const addTag: AddTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, addTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(
    context,
    agent,
    data.workspaceId
  );

  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.Tag,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkTagNameExists(context, workspace.resourceId, data.tag.name);
  let tag = await context.data.tag.saveItem({
    ...data.tag,
    workspaceId: workspace.resourceId,
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  });

  return {
    tag: tagExtractor(tag),
  };
};

export default addTag;
