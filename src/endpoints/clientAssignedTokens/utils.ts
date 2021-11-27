import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {ISessionAgent, BasicCRUDActions} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizationForClientAssignedToken} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor} from '../utils';
import ClientAssignedTokenQueries from './queries';
import {IPublicClientAssignedToken} from './types';

const clientAssignedTokenFields = getFields<IPublicClientAssignedToken>({
  tokenId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  organizationId: true,
  environmentId: true,
  version: true,
  issuedAt: getDateString,
  expires: true,
});

export const clientAssignedTokenExtractor = makeExtract(
  clientAssignedTokenFields
);

export const clientAssignedTokenListExtractor = makeListExtract(
  clientAssignedTokenFields
);

export async function checkClientAssignedTokenAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  token: IClientAssignedToken,
  action: BasicCRUDActions
) {
  const organization = await checkOrganizationExists(
    context,
    token.organizationId
  );

  await checkAuthorizationForClientAssignedToken(
    context,
    agent,
    organization.organizationId,
    token,
    action
  );

  return {agent, token, organization};
}

export async function checkClientAssignedTokenAuthorizationWithTokenId(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions
) {
  const clientassignedtoken = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(id)
  );

  return checkClientAssignedTokenAuthorization(
    context,
    agent,
    clientassignedtoken,
    action
  );
}

export abstract class ClientAssignedTokenUtils {
  static extractPublicToken = clientAssignedTokenExtractor;
  static extractPublicTokenList = clientAssignedTokenListExtractor;
}
