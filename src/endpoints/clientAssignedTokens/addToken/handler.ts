import {
  CLIENT_ASSIGNED_TOKEN_VERSION,
  IClientAssignedToken,
} from '../../../definitions/clientAssignedToken';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {ClientAssignedTokenUtils} from '../utils';
import {AddClientAssignedTokenEndpoint} from './types';
import {addClientAssignedTokenJoiSchema} from './validation';

const addClientAssignedToken: AddClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addClientAssignedTokenJoiSchema);
  const user = await context.session.getUser(context, instData);
  const token: IClientAssignedToken = await context.data.clientAssignedToken.saveItem(
    {
      ...data.token,
      tokenId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: user.userId,
        agentType: SessionAgentType.User,
      },
      version: CLIENT_ASSIGNED_TOKEN_VERSION,
      issuedAt: getDateString(),
    }
  );

  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
  };
};

export default addClientAssignedToken;
