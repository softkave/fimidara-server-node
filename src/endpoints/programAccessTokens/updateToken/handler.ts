import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
import ProgramAccessTokenQueries from '../queries';
import {
  checkProgramAccessTokenAuthorization02,
  programAccessTokenExtractor,
} from '../utils';
import {UpdateProgramAccessTokenEndpoint} from './types';
import {updateProgramAccessTokenJoiSchema} from './validation';

/**
 * updateProgramAccessTokenPresets.
 * Updates the referenced program access token's presets.
 *
 * Ensure that:
 * - Auth check and permission check
 * - Check presets exists and access check
 * - Update token presets
 */

const updateProgramAccessToken: UpdateProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(
    agent,
    data.onReferenced && data.tokenId
  );

  const checkResult = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  let token = checkResult.token;
  const tokenUpdate: Partial<IProgramAccessToken> = {
    name: data.token.name,
    description: data.token.description,
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  if (data.token.presets) {
    await checkPresetsExist(
      context,
      agent,
      checkResult.organization.resourceId,
      data.token.presets
    );

    tokenUpdate.presets = data.token.presets?.map(preset => ({
      ...preset,
      assignedAt: getDateString(),
      assignedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }));
  }

  token = await context.data.programAccessToken.assertUpdateItem(
    ProgramAccessTokenQueries.getById(tokenId),
    tokenUpdate
  );

  return {
    token: programAccessTokenExtractor(token),
  };
};

export default updateProgramAccessToken;
