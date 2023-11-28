import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {PublicAssignedTag, PublicTag, Tag} from '../../definitions/tag';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
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
  context: BaseContextType,
  agent: SessionAgent,
  tag: Tag,
  action: PermissionAction,
  opts?: SemanticProviderRunOptions
) {
  const workspace = await checkWorkspaceExists(context, tag.workspaceId);
  await checkAuthorizationWithAgent({
    context,
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {action, targetId: tag.resourceId},
  });
  return {agent, tag, workspace};
}

export async function checkTagAuthorization02(
  context: BaseContextType,
  agent: SessionAgent,
  id: string,
  action: PermissionAction
) {
  const tag = await context.semantic.tag.getOneById(id);
  assertTag(tag);
  return checkTagAuthorization(context, agent, tag, action);
}

export function throwTagNotFound() {
  throw kReuseableErrors.tag.notFound();
}

export function assertTag(tag?: Tag | null): asserts tag {
  appAssert(tag, kReuseableErrors.tag.notFound());
}
