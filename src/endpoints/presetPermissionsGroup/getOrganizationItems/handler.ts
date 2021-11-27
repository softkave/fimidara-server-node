import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizationForPresetPermissionsGroup} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
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

  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  const items = await context.data.presetPermissionsGroup.getManyItems(
    PresetPermissionsItemQueries.getByOrganizationId(data.organizationId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    items.map(item =>
      checkAuthorizationForPresetPermissionsGroup(
        context,
        agent,
        organization.organizationId,
        item,
        BasicCRUDActions.Read
      )
    )
  );

  const allowedItems = items.filter((item, i) => !!permittedReads[i]);
  return {
    items: PresetPermissionsItemUtils.extractPublicPresetPermissionsItemList(
      allowedItems
    ),
  };
};

export default getOrganizationPresetPermissionsItem;
