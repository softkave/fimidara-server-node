import {omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {BasicCRUDActions} from '../../../definitions/system';
import {getDate, getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
import EndpointReusableQueries from '../../queries';
import {
  checkClientAssignedTokenAuthorization03,
  clientAssignedTokenExtractor,
} from '../utils';
import {UpdateClientAssignedTokenEndpoint} from './types';
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

const updateClientAssignedToken: UpdateClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
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

  const update: Partial<IClientAssignedToken> = {
    ...omit(data.token, 'presets'),
    lastUpdatedAt: getDate(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  if (data.token.presets) {
    await checkPresetsExist(
      context,
      agent,
      checkResult.organization,
      data.token.presets
    );

    update.presets = data.token.presets.map(preset => ({
      ...preset,
      assignedAt: getDateString(),
      assignedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }));
  }

  let token = checkResult.token;
  token = await context.data.clientAssignedToken.assertUpdateItem(
    EndpointReusableQueries.getById(checkResult.token.resourceId),
    update
  );

  return {
    token: clientAssignedTokenExtractor(token),
  };
};

export default updateClientAssignedToken;
