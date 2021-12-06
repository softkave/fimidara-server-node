import {
  IAssignedPresetPermissionsGroup,
  IPresetPermissionsGroup,
} from '../../definitions/presetPermissionsGroup';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor} from '../utils';
import PresetPermissionsGroupQueries from './queries';
import {IPublicPresetPermissionsItem} from './types';

const presetPermissionsItemFields = getFields<IPublicPresetPermissionsItem>({
  itemId: true,
  organizationId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
});

export const presetPermissionsItemExtractor = makeExtract(
  presetPermissionsItemFields
);

export const presetPermissionsItemListExtractor = makeListExtract(
  presetPermissionsItemFields
);

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
    organization.organizationId,
    preset.presetId,
    AppResourceType.PresetPermissionsGroup,
    makeBasePermissionOwnerList(organization.organizationId),
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

export function throwPresetPermissionsGroupNotFound() {
  throw new NotFoundError('Preset permissions group not found');
}

export abstract class PresetPermissionsItemUtils {
  static extractPublicPresetPermissionsItem = presetPermissionsItemExtractor;
  static extractPublicPresetPermissionsItemList = presetPermissionsItemListExtractor;
}
