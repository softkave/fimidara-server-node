import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getClientAssignedTokenId} from '../../contexts/SessionContext';
import ClientAssignedTokenQueries from '../queries';
import {
  checkClientAssignedTokenAuthorization02,
  clientAssignedTokenExtractor,
} from '../utils';
import {UpdateClientAssignedTokenPresetsEndpoint} from './types';
import {updateClientAssignedTokenPresetsJoiSchema} from './validation';

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
    data.onReferenced && data.tokenId
  );

  const checkResult = await checkClientAssignedTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  let token = checkResult.token;
  token = await context.data.clientAssignedToken.assertUpdateItem(
    ClientAssignedTokenQueries.getById(tokenId),
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
