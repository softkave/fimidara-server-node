import {validate} from '../../../utilities/validate';
import PresetPermissionsItemQueries from '../queries';
import {PresetPermissionsItemUtils} from '../utils';
import {GetOrganizationPresetPermissionsItemEndpoint} from './types';
import {getOrganizationPresetPermissionsItemJoiSchema} from './validation';

const getOrganizationPresetPermissionsItem: GetOrganizationPresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    getOrganizationPresetPermissionsItemJoiSchema
  );
  const user = await context.session.getUser(context, instData);
  const items = await context.data.presetPermissionsGroup.getManyItems(
    PresetPermissionsItemQueries.getByOrganizationId(data.organizationId)
  );

  return {
    items: PresetPermissionsItemUtils.extractPublicPresetPermissionsItemList(
      items
    ),
  };
};

export default getOrganizationPresetPermissionsItem;
