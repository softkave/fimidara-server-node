import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {UsageRecordCategoryMap} from '../../definitions/usageRecord';
import {
  PublicUsageThreshold,
  PublicUsageThresholdLock,
  PublicWorkspace,
  Workspace,
} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {
  ExtractFieldsFrom,
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../../utils/extract';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {
  getWorkspaceIdFromSessionAgent,
  getWorkspaceIdNoThrow,
} from '../../utils/sessionUtils';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';
import {agentExtractor, workspaceResourceFields} from '../extractors';
import folderValidationSchemas from '../folders/validation';
import {EndpointOptionalWorkspaceIDParam} from '../types';

const usageThresholdItemPublicFields = getFields<PublicUsageThreshold>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: true,
  category: true,
  budget: true,
});
const usageThresholdLockItemPublicFields = getFields<PublicUsageThresholdLock>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: true,
  category: true,
  locked: true,
});
const usageThresholdItemIfExistExtractor = makeExtractIfPresent(
  usageThresholdItemPublicFields
);
const usageThresholdLockItemIfExistExtractor = makeExtractIfPresent(
  usageThresholdLockItemPublicFields
);
const usageThresholdsPublicFields = getFields<PublicWorkspace['usageThresholds']>({
  [UsageRecordCategoryMap.Total]: usageThresholdItemIfExistExtractor,
  [UsageRecordCategoryMap.Storage]: usageThresholdItemIfExistExtractor,
  [UsageRecordCategoryMap.BandwidthIn]: usageThresholdItemIfExistExtractor,
  [UsageRecordCategoryMap.BandwidthOut]: usageThresholdItemIfExistExtractor,
});
const usageThresholdLocksPublicFields = getFields<PublicWorkspace['usageThresholdLocks']>(
  {
    [UsageRecordCategoryMap.Total]: usageThresholdLockItemIfExistExtractor,
    [UsageRecordCategoryMap.Storage]: usageThresholdLockItemIfExistExtractor,
    [UsageRecordCategoryMap.BandwidthIn]: usageThresholdLockItemIfExistExtractor,
    [UsageRecordCategoryMap.BandwidthOut]: usageThresholdLockItemIfExistExtractor,
  }
);
const usageThresholdExistExtractor = makeExtract(usageThresholdsPublicFields);
const usageThresholdLockExistExtractor = makeExtract(usageThresholdLocksPublicFields);
const workspacePublicFields: ExtractFieldsFrom<PublicWorkspace> = {
  ...workspaceResourceFields,
  name: true,
  rootname: true,
  description: true,
  publicPermissionGroupId: true,
  billStatus: true,
  billStatusAssignedAt: true,
  usageThresholds: usageThresholdExistExtractor,
  usageThresholdLocks: usageThresholdLockExistExtractor,
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
  opts?: SemanticProviderRunOptions
) {
  const w = await kSemanticModels.workspace().getOneById(workspaceId, opts);
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
  action: PermissionAction,
  opts?: SemanticProviderRunOptions
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
  action: PermissionAction,
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
  opts?: SemanticProviderRunOptions
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
