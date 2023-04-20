import {AppActionType, SessionAgent} from '../../definitions/system';
import {PublicAssignedTag, PublicTag, Tag} from '../../definitions/tag';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {reuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContext} from '../contexts/types';
import {agentExtractor, workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';

const assignedTagFields = getFields<PublicAssignedTag>({
  tagId: true,
  assignedAt: true,
  assignedBy: agentExtractor,
});

export const assignedTagExtractor = makeExtract(assignedTagFields);
export const assignedTagListExtractor = makeListExtract(assignedTagFields);

const tagFields = getFields<PublicTag>({
  ...workspaceResourceFields,
  name: true,
  description: true,
});

export const tagExtractor = makeExtract(tagFields);
export const tagListExtractor = makeListExtract(tagFields);

export async function checkTagAuthorization(
  context: BaseContext,
  agent: SessionAgent,
  tag: Tag,
  action: AppActionType
) {
  const workspace = await checkWorkspaceExists(context, tag.workspaceId);
  await checkAuthorization({
    context,
    agent,
    action,
    workspace,
    workspaceId: workspace.resourceId,
    targets: {targetId: tag.resourceId},
  });
  return {agent, tag, workspace};
}

export async function checkTagAuthorization02(
  context: BaseContext,
  agent: SessionAgent,
  id: string,
  action: AppActionType
) {
  const tag = await context.semantic.tag.getOneById(id);
  assertTag(tag);
  return checkTagAuthorization(context, agent, tag, action);
}

export function throwTagNotFound() {
  throw reuseableErrors.tag.notFound();
}

export function assertTag(tag?: Tag | null): asserts tag {
  appAssert(tag, reuseableErrors.tag.notFound());
}
