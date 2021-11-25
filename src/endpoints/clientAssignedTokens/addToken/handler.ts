import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorizaton,
  getPermissionOwnerListWithOrganizationId,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {CURRENT_TOKEN_VERSION} from '../../contexts/SessionContext';
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
  const organization = await checkOrganizationExists(
    context,
    data.token.organizationId
  );

  await checkAuthorizaton(
    context,
    agent,
    organization.organizationId,
    null,
    AppResourceType.ClientAssignedToken,
    getPermissionOwnerListWithOrganizationId(organization.organizationId),
    BasicCRUDActions.Create
  );

  const token: IClientAssignedToken = await context.data.clientAssignedToken.saveItem(
    {
      ...data.token,
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
  };
};

export default addClientAssignedToken;
