import {AppResourceType, BasicCRUDActions, IAgent} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {validate} from '../../../utils/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {checkTagNameExists} from '../checkTagNameExists';
import {tagExtractor} from '../utils';
import {AddTagEndpoint} from './types';
import {addTagJoiSchema} from './validation';

const addTag: AddTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, addTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);

  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.Tag,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkTagNameExists(context, workspace.resourceId, data.tag.name);
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  const tag = await context.data.tag.insertItem({
    ...data.tag,
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    workspaceId: workspace.resourceId,
    resourceId: getNewIdForResource(AppResourceType.Tag),
  });

  return {
    tag: tagExtractor(tag),
  };
};

export default addTag;
