import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {IAssignedTag, IPublicTag, ITag} from '../../definitions/tag';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {reuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import EndpointReusableQueries from '../queries';
import {agentExtractor, workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';

const assignedTagFields = getFields<IAssignedTag>({
  tagId: true,
  assignedAt: true,
  assignedBy: agentExtractor,
});

export const assignedTagExtractor = makeExtract(assignedTagFields);
export const assignedTagListExtractor = makeListExtract(assignedTagFields);

const tagFields = getFields<IPublicTag>({
  ...workspaceResourceFields,
  name: true,
  description: true,
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
    action,
    nothrow,
    workspaceId: workspace.resourceId,
    targets: [{targetId: tag.resourceId}],
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
  throw reuseableErrors.tag.notFound();
}

export function assertTag(tag?: ITag | null): asserts tag {
  appAssert(tag, reuseableErrors.tag.notFound());
}
