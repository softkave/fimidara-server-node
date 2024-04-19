import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {PublicAssignedTag, PublicTag, Tag} from '../../definitions/tag';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {agentExtractor, workspaceResourceFields} from '../extractors';
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
  agent: SessionAgent,
  tag: Tag,
  action: PermissionAction,
  opts?: SemanticProviderOpParams
) {
  const workspace = await checkWorkspaceExists(tag.workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {action, targetId: tag.resourceId},
  });
  return {agent, tag, workspace};
}

export async function checkTagAuthorization02(
  agent: SessionAgent,
  id: string,
  action: PermissionAction
) {
  const tag = await kSemanticModels.tag().getOneById(id);
  assertTag(tag);
  return checkTagAuthorization(agent, tag, action);
}

export function throwTagNotFound() {
  throw kReuseableErrors.tag.notFound();
}

export function assertTag(tag?: Tag | null): asserts tag {
  appAssert(tag, kReuseableErrors.tag.notFound());
}
