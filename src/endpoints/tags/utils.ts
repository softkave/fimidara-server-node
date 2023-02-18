import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {IAssignedTag, IPublicTag, ITag} from '../../definitions/tag';
import {getDateString} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import EndpointReusableQueries from '../queries';
import {agentExtractor} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';

const assignedTagFields = getFields<IAssignedTag>({
  tagId: true,
  assignedAt: getDateString,
  assignedBy: agentExtractor,
});

export const assignedTagExtractor = makeExtract(assignedTagFields);
export const assignedTagListExtractor = makeListExtract(assignedTagFields);

const tagFields = getFields<IPublicTag>({
  resourceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  workspaceId: true,
  name: true,
  description: true,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
});

export const tagExtractor = makeExtract(tagFields);
export const tagListExtractor = makeListExtract(tagFields);

export async function checkTagAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  tag: ITag,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, tag.workspaceId);

  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    targetId: tag.resourceId,
    type: AppResourceType.Tag,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  return {agent, tag, workspace};
}

export async function checkTagAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const tag = await context.data.tag.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(id)
  );

  return checkTagAuthorization(context, agent, tag, action, nothrow);
}

export function throwTagNotFound() {
  throw new NotFoundError('Tag not found');
}
