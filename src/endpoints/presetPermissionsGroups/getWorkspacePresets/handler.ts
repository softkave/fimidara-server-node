import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {resourceListWithAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {PermissionDeniedError} from '../../user/errors';
import PresetPermissionsGroupQueries from '../queries';
import {presetPermissionsGroupListExtractor} from '../utils';
import {GetWorkspacePresetPermissionsGroupsEndpoint} from './types';
import {getWorkspacePresetPermissionsGroupsJoiSchema} from './validation';
import {getWorkspaceId} from '../../contexts/SessionContext';

const getWorkspacePresetPermissionsGroups: GetWorkspacePresetPermissionsGroupsEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      getWorkspacePresetPermissionsGroupsJoiSchema
    );

    const agent = await context.session.getAgent(context, instData);
    const workspaceId = getWorkspaceId(agent, data.workspaceId);
    const workspace = await checkWorkspaceExists(context, workspaceId);
    const items = await context.data.preset.getManyItems(
      PresetPermissionsGroupQueries.getByWorkspaceId(workspaceId)
    );

    // TODO: can we do this together, so that we don't waste compute
    const permittedReads = await Promise.all(
      items.map(item =>
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
          nothrow: true,
        })
      )
    );

    let allowedItems = items.filter((item, i) => !!permittedReads[i]);

    if (allowedItems.length === 0 && items.length > 0) {
      throw new PermissionDeniedError();
    }

    allowedItems = await resourceListWithAssignedPresetsAndTags(
      context,
      workspace.resourceId,
      allowedItems,
      AppResourceType.PresetPermissionsGroup
    );

    return {
      presets: presetPermissionsGroupListExtractor(allowedItems),
    };
  };

export default getWorkspacePresetPermissionsGroups;
