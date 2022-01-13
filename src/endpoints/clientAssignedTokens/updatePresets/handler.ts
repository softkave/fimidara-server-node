import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getClientAssignedTokenId} from '../../contexts/SessionContext';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
import EndpointReusableQueries from '../../queries';
import {
  checkClientAssignedTokenAuthorization02,
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

const updateClientAssignedTokenPresets: UpdateClientAssignedTokenPresetsEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    updateClientAssignedTokenPresetsJoiSchema
  );

  const agent = await context.session.getAgent(context, instData);
  const tokenId = getClientAssignedTokenId(
    agent,
    data.tokenId,
    data.onReferenced
  );

  const checkResult = await checkClientAssignedTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  await checkPresetsExist(
    context,
    agent,
    checkResult.organization.resourceId,
    data.presets
  );

  let token = checkResult.token;
  token = await context.data.clientAssignedToken.assertUpdateItem(
    EndpointReusableQueries.getById(tokenId),
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
