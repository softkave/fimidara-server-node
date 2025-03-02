import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {PublicAssignedTag, PublicTag, Tag} from '../../definitions/tag.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {agentExtractor, workspaceResourceFields} from '../extractors.js';
import {checkWorkspaceExists} from '../workspaces/utils.js';

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
  action: FimidaraPermissionAction,
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
  action: FimidaraPermissionAction
) {
  const tag = await kIjxSemantic.tag().getOneById(id);
  assertTag(tag);
  return checkTagAuthorization(agent, tag, action);
}

export function throwTagNotFound() {
  throw kReuseableErrors.tag.notFound();
}

export function assertTag(tag?: Tag | null): asserts tag {
  appAssert(tag, kReuseableErrors.tag.notFound());
}
