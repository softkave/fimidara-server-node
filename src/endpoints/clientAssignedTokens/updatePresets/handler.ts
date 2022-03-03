import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
import EndpointReusableQueries from '../../queries';
import {
  checkClientAssignedTokenAuthorization03,
  clientAssignedTokenExtractor,
} from '../utils';
import {UpdateClientAssignedTokenPresetsEndpoint} from './types';
import {updateClientAssignedTokenPresetsJoiSchema} from './validation';

/**
 * updateClientAssignedTokenPresets.
 * Updates the presets assigned to the reference client assigned token.
 *
 * Ensure that:
 * - Auth check
 * - Check that presets exist
 * - Update token presets
 *
 * TODO:
 * - [Medium] Change to update token for expires
 */

const updateClientAssignedTokenPresets: UpdateClientAssignedTokenPresetsEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      updateClientAssignedTokenPresetsJoiSchema
    );

    const agent = await context.session.getAgent(context, instData);
    const checkResult = await checkClientAssignedTokenAuthorization03(
      context,
      agent,
      data,
      BasicCRUDActions.Update
    );

    await checkPresetsExist(
      context,
      agent,
      checkResult.organization.resourceId,
      data.presets
    );

    let token = checkResult.token;
    token = await context.data.clientAssignedToken.assertUpdateItem(
      EndpointReusableQueries.getById(checkResult.token.resourceId),
      {
        presets: data.presets.map(preset => ({
          ...preset,
          assignedAt: getDateString(),
          assignedBy: {
            agentId: agent.agentId,
            agentType: agent.agentType,
          },
        })),
      }
    );

    return {
      token: clientAssignedTokenExtractor(token),
    };
  };

export default updateClientAssignedTokenPresets;
