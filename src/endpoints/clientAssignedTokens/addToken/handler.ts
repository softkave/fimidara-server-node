import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {
  CURRENT_TOKEN_VERSION,
  getOrganizationId,
  TokenType,
} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
import {ClientAssignedTokenUtils} from '../utils';
import {AddClientAssignedTokenEndpoint} from './types';
import {addClientAssignedTokenJoiSchema} from './validation';

const addClientAssignedToken: AddClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const organization = await checkOrganizationExists(context, organizationId);
  await checkAuthorization(
    context,
    agent,
    organization.organizationId,
    null,
    AppResourceType.ClientAssignedToken,
    makeBasePermissionOwnerList(organization.organizationId),
    BasicCRUDActions.Create
  );

  const token: IClientAssignedToken = await context.data.clientAssignedToken.saveItem(
    {
      expires: data.token.expires,
      organizationId: organization.organizationId,
      tokenId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
      presets: [],
    }
  );

  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
    tokenStr: context.session.encodeToken(
      context,
      token.tokenId,
      TokenType.ClientAssignedToken,
      token.expires
    ),
  };
};

export default addClientAssignedToken;
