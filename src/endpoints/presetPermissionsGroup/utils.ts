import {
  IAssignedPresetPermissionsGroup,
  IPresetPermissionsGroup,
} from '../../definitions/presetPermissionsGroup';
import {ISessionAgent, BasicCRUDActions} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizationForPresetPermissionsGroup} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
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
  action: BasicCRUDActions
) {
  const organization = await checkOrganizationExists(
    context,
    preset.organizationId
  );

  await checkAuthorizationForPresetPermissionsGroup(
    context,
    agent,
    organization.organizationId,
    preset,
    action
  );

  return {agent, preset, organization};
}

export async function checkPresetPermissionsGroupAuthorizationWithId(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions
) {
  const presetpermissionsgroup = await context.data.presetPermissionsGroup.assertGetItem(
    PresetPermissionsGroupQueries.getById(id)
  );
  return checkPresetPermissionsGroupAuthorization(
    context,
    agent,
    presetpermissionsgroup,
    action
  );
}

export abstract class PresetPermissionsItemUtils {
  static extractPublicPresetPermissionsItem = presetPermissionsItemExtractor;
  static extractPublicPresetPermissionsItemList = presetPermissionsItemListExtractor;
}
