import {
  IAssignedPresetPermissionsGroup,
  IPresetPermissionsGroup,
} from '../../definitions/presetPermissionsGroup';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import PresetPermissionsGroupQueries from './queries';
import {IPresetInput, IPublicPresetPermissionsGroup} from './types';

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
  organizationId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  lastUpdatedAt: getDateStringIfPresent,
  lastUpdatedBy: agentExtractorIfPresent,
  name: true,
  description: true,
  presets: assignedPresetsListExtractor,
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
  const organization = await checkOrganizationExists(
    context,
    preset.organizationId
  );

  await checkAuthorization(
    context,
    agent,
    organization.resourceId,
    preset.resourceId,
    AppResourceType.PresetPermissionsGroup,
    makeBasePermissionOwnerList(organization.resourceId),
    action,
    nothrow
  );

  return {agent, preset, organization};
}

export async function checkPresetPermissionsGroupAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const presetpermissionsgroup = await context.data.presetPermissionsGroup.assertGetItem(
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

export async function checkPresetsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  presetInputs: IPresetInput[]
) {
  const presets = await Promise.all(
    presetInputs.map(item =>
      context.data.presetPermissionsGroup.assertGetItem(
        PresetPermissionsGroupQueries.getById(item.presetId)
      )
    )
  );

  await Promise.all(
    presets.map(item =>
      checkAuthorization(
        context,
        agent,
        organizationId,
        item.resourceId,
        AppResourceType.PresetPermissionsGroup,
        makeBasePermissionOwnerList(organizationId),
        BasicCRUDActions.Read
      )
    )
  );

  return presets;
}

export function throwPresetPermissionsGroupNotFound() {
  throw new NotFoundError('Preset permissions group not found');
}

export abstract class PresetPermissionsGroupUtils {
  static extractPublicPresetPermissionsGroup = presetPermissionsGroupExtractor;
  static extractPublicPresetPermissionsGroupList = presetPermissionsGroupListExtractor;
}
