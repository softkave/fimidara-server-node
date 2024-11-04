import {omit} from 'lodash-es';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists.js';
import {
  assertPermissionGroup,
  getPermissionGroupByMatcher,
  permissionGroupExtractor,
} from '../utils.js';
import {UpdatePermissionGroupEndpoint} from './types.js';
import {updatePermissionGroupJoiSchema} from './validation.js';

const updatePermissionGroupEndpoint: UpdatePermissionGroupEndpoint =
  async reqData => {
    const data = validate(reqData.data, updatePermissionGroupJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.updatePermission,
    });

    const permissionGroup = await kSemanticModels
      .utils()
      .withTxn(async opts => {
        const {permissionGroup} = await getPermissionGroupByMatcher(
          workspace.resourceId,
          data,
          opts
        );

        const update: Partial<PermissionGroup> = {
          ...omit(data.data, 'permissionGroups'),
          lastUpdatedAt: getTimestamp(),
          lastUpdatedBy: getActionAgentFromSessionAgent(agent),
        };

        if (update.name && update.name !== permissionGroup.name) {
          await checkPermissionGroupNameExists(
            workspace.resourceId,
            update.name,
            opts
          );
        }

        const updatedPermissionGroup = await kSemanticModels
          .permissionGroup()
          .getAndUpdateOneById(permissionGroup.resourceId, update, opts);
        assertPermissionGroup(updatedPermissionGroup);

        return updatedPermissionGroup;
      });

    return {permissionGroup: permissionGroupExtractor(permissionGroup!)};
  };

export default updatePermissionGroupEndpoint;
