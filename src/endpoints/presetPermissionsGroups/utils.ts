import assert = require('assert');
import {IWorkspace} from '../../definitions/workspace';
import {
  IAssignedPresetPermissionsGroup,
  IPresetInput,
  IPresetPermissionsGroup,
  IPresetPermissionsGroupMatcher,
  IPublicPresetPermissionsGroup,
} from '../../definitions/presetPermissionsGroup';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
  IAgent,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {indexArray} from '../../utilities/indexArray';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {assertGetWorkspaceIdFromAgent} from '../contexts/SessionContext';
import {InvalidRequestError, NotFoundError} from '../errors';
import {checkWorkspaceExists} from '../workspaces/utils';
import {assignedTagListExtractor} from '../tags/utils';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {PresetPermissionsGroupDoesNotExistError} from './errors';
import PresetPermissionsGroupQueries from './queries';

const assignedPresetsFields = getFields<IAssignedPresetPermissionsGroup>({
  presetId: true,
  assignedAt: getDateString,
  assignedBy: agentExtractor,
  order: true,
});

export const assignedPresetsExtractor = makeExtract(assignedPresetsFields);
export const assignedPresetsListExtractor = makeListExtract(
  assignedPresetsFields
);

const presetPermissionsGroupFields = getFields<IPublicPresetPermissionsGroup>({
  resourceId: true,
  workspaceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  lastUpdatedAt: getDateStringIfPresent,
  lastUpdatedBy: agentExtractorIfPresent,
  name: true,
  description: true,
  presets: assignedPresetsListExtractor,
  tags: assignedTagListExtractor,
});

export const presetPermissionsGroupExtractor = makeExtract(
  presetPermissionsGroupFields
);

export const presetPermissionsGroupListExtractor = makeListExtract(
  presetPermissionsGroupFields
);

export async function checkPresetPermissionsGroupAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  preset: IPresetPermissionsGroup,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, preset.workspaceId);

  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    resource: preset,
    type: AppResourceType.PresetPermissionsGroup,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
  });

  return {agent, preset, workspace};
}

export async function checkPresetPermissionsGroupAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const presetpermissionsgroup = await context.data.preset.assertGetItem(
    PresetPermissionsGroupQueries.getById(id)
  );

  return checkPresetPermissionsGroupAuthorization(
    context,
    agent,
    presetpermissionsgroup,
    action,
    nothrow
  );
}

export async function checkPresetPermissionsGroupAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  input: IPresetPermissionsGroupMatcher,
  action: BasicCRUDActions,
  nothrow = false
) {
  let preset: IPresetPermissionsGroup | null = null;

  if (!input.presetId && !input.name) {
    throw new InvalidRequestError('Preset ID or name not set');
  }

  if (input.presetId) {
    preset = await context.data.preset.assertGetItem(
      PresetPermissionsGroupQueries.getById(input.presetId)
    );
  } else if (input.name) {
    const workspaceId =
      input.workspaceId || assertGetWorkspaceIdFromAgent(agent);

    preset = await context.data.preset.assertGetItem(
      PresetPermissionsGroupQueries.getByWorkspaceAndName(
        workspaceId,
        input.name
      )
    );
  }

  assert(preset, new PresetPermissionsGroupDoesNotExistError());
  return checkPresetPermissionsGroupAuthorization(
    context,
    agent,
    preset,
    action,
    nothrow
  );
}

export async function checkPresetsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  presetInputs: IPresetInput[]
) {
  const presets = await Promise.all(
    presetInputs.map(item =>
      context.data.preset.assertGetItem(
        PresetPermissionsGroupQueries.getById(item.presetId)
      )
    )
  );

  await Promise.all(
    presets.map(item =>
      checkAuthorization({
        context,
        agent,
        workspace,
        resource: item,
        type: AppResourceType.PresetPermissionsGroup,
        permissionOwners: makeWorkspacePermissionOwnerList(
          workspace.resourceId
        ),
        action: BasicCRUDActions.Read,
      })
    )
  );

  return presets;
}

export function mergePresetsWithInput(
  presets: IAssignedPresetPermissionsGroup[],
  input: IPresetInput[],
  agent: IAgent
) {
  const inputMap = indexArray(input, {path: 'presetId'});
  return presets
    .filter(item => !inputMap[item.presetId])
    .concat(
      input.map(preset => ({
        ...preset,
        assignedAt: getDateString(),
        assignedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      }))
    );
}

export function throwPresetPermissionsGroupNotFound() {
  throw new NotFoundError('Preset permissions group not found');
}
