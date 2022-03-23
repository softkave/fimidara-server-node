import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import {PermissionDeniedError} from '../../user/errors';
import PresetPermissionsGroupQueries from '../queries';
import {PresetPermissionsGroupUtils} from '../utils';
import {GetOrganizationPresetPermissionsGroupsEndpoint} from './types';
import {getOrganizationPresetPermissionsGroupsJoiSchema} from './validation';

/**
 * getOrganizationPresetPermissionsItem.
 * Returns the referenced organization's presets
 * the calling agent has read access to.
 *
 * Ensure that:
 * - Auth check and permission check
 * - Return presets
 */

const getOrganizationPresetPermissionsGroups: GetOrganizationPresetPermissionsGroupsEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      getOrganizationPresetPermissionsGroupsJoiSchema
    );

    const agent = await context.session.getAgent(context, instData);
    const organization = await checkOrganizationExists(
      context,
      data.organizationId
    );

    const items = await context.data.preset.getManyItems(
      PresetPermissionsGroupQueries.getByOrganizationId(data.organizationId)
    );

    // TODO: can we do this together, so that we don't waste compute
    const permittedReads = await Promise.all(
      items.map(item =>
        checkAuthorization({
          context,
          agent,
          organization,
          resource: item,
          type: AppResourceType.PresetPermissionsGroup,
          permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
          action: BasicCRUDActions.Read,
          nothrow: true,
        })
      )
    );

    const allowedItems = items.filter((item, i) => !!permittedReads[i]);

    if (allowedItems.length === 0 && items.length > 0) {
      throw new PermissionDeniedError();
    }

    return {
      presets:
        PresetPermissionsGroupUtils.extractPublicPresetPermissionsGroupList(
          allowedItems
        ),
    };
  };

export default getOrganizationPresetPermissionsGroups;
