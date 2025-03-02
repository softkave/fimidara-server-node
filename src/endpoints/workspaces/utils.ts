import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {kUsageRecordCategory} from '../../definitions/usageRecord.js';
import {
  PublicUsageThreshold,
  PublicWorkspace,
  Workspace,
} from '../../definitions/workspace.js';
import {appAssert} from '../../utils/assertion.js';
import {
  ExtractFieldsFrom,
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../../utils/extract.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {
  getWorkspaceIdFromSessionAgent,
  getWorkspaceIdNoThrow,
} from '../../utils/sessionUtils.js';
import {NotFoundError} from '../errors.js';
import {agentExtractor, workspaceResourceFields} from '../extractors.js';
import folderValidationSchemas from '../folders/validation.js';
import {EndpointOptionalWorkspaceIDParam} from '../types.js';

const usageThresholdItemPublicFields = getFields<PublicUsageThreshold>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: true,
  category: true,
  budget: true,
  usage: true,
});

const usageThresholdItemIfExistExtractor = makeExtractIfPresent(
  usageThresholdItemPublicFields
);

const usageThresholdsPublicFields = getFields<
  PublicWorkspace['usageThresholds']
>({
  [kUsageRecordCategory.total]: usageThresholdItemIfExistExtractor,
  [kUsageRecordCategory.storage]: usageThresholdItemIfExistExtractor,
  [kUsageRecordCategory.storageEverConsumed]:
    usageThresholdItemIfExistExtractor,
  [kUsageRecordCategory.bandwidthIn]: usageThresholdItemIfExistExtractor,
  [kUsageRecordCategory.bandwidthOut]: usageThresholdItemIfExistExtractor,
});

const usageThresholdExistExtractor = makeExtract(usageThresholdsPublicFields);
const workspacePublicFields: ExtractFieldsFrom<PublicWorkspace> = {
  ...workspaceResourceFields,
  name: true,
  rootname: true,
  description: true,
  publicPermissionGroupId: true,
  billStatus: true,
  billStatusAssignedAt: true,
  usageThresholds: usageThresholdExistExtractor,
};

const workspaceFields = getFields<PublicWorkspace>(workspacePublicFields);
export const workspaceExtractor = makeExtract(workspaceFields);
export const workspaceListExtractor = makeListExtract(workspaceFields);

export function throwWorkspaceNotFound() {
  throw new NotFoundError('Workspace not found');
}

export function assertWorkspace(
  workspace: Workspace | null | undefined
): asserts workspace {
  if (!workspace) {
    throwWorkspaceNotFound();
  }
}

export async function checkWorkspaceExists(
  workspaceId: string,
  opts?: SemanticProviderOpParams
) {
  const w = await kIjxSemantic.workspace().getOneById(workspaceId, opts);
  assertWorkspace(w);
  return w;
}

export async function checkWorkspaceExistsWithAgent(
  agent: SessionAgent,
  workspaceId?: string
) {
  if (!workspaceId) {
    workspaceId = getWorkspaceIdFromSessionAgent(agent, workspaceId);
  }

  return checkWorkspaceExists(workspaceId);
}

export async function checkWorkspaceAuthorization(
  agent: SessionAgent,
  workspace: Workspace,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {action, targetId: workspace.resourceId},
  });
  return {agent, workspace};
}

export async function checkWorkspaceAuthorization02(
  agent: SessionAgent,
  action: FimidaraPermissionAction,
  id?: string
) {
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, id);
  const workspace = await checkWorkspaceExists(workspaceId);
  return checkWorkspaceAuthorization(agent, workspace, action);
}

export abstract class WorkspaceUtils {
  static getPublicWorkspace = workspaceExtractor;
  static getPublicWorkspaceList = workspaceListExtractor;
  static throwWorkspaceNotFound = throwWorkspaceNotFound;
}

export function makeRootnameFromName(name: string): string {
  return name
    .replace(new RegExp(folderValidationSchemas.notNameRegex, 'g'), ' ')
    .replace(/[\s-]+/g, '-')
    .toLowerCase();
}

export async function getWorkspaceFromEndpointInput(
  agent: SessionAgent,
  data: EndpointOptionalWorkspaceIDParam,
  opts?: SemanticProviderOpParams
) {
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId, opts);
  return {workspace};
}

export async function tryGetWorkspaceFromEndpointInput(
  agent: SessionAgent,
  data: EndpointOptionalWorkspaceIDParam
) {
  let workspace: Workspace | undefined = undefined;
  const workspaceId = getWorkspaceIdNoThrow(agent, data.workspaceId);
  if (workspaceId) workspace = await checkWorkspaceExists(workspaceId);
  return {workspace};
}

export function assertRootname(rootname: unknown): asserts rootname {
  appAssert(rootname, kReuseableErrors.workspace.noRootname());
}
