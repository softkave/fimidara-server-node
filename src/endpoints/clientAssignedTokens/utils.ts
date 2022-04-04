import assert = require('assert');
import {
  IClientAssignedToken,
  IPublicClientAssignedToken,
} from '../../definitions/clientAssignedToken';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import cast from '../../utilities/fns';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {
  assertGetOrganizationIdFromAgent,
  getClientAssignedTokenIdNoThrow,
  TokenType,
} from '../contexts/SessionContext';
import {InvalidRequestError, NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {assignedPresetsListExtractor} from '../presetPermissionsGroups/utils';
import EndpointReusableQueries from '../queries';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {ClientAssignedTokenDoesNotExistError} from './errors';

const clientAssignedTokenFields = getFields<IPublicClientAssignedToken>({
  resourceId: true,
  providedResourceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  organizationId: true,
  version: true,
  issuedAt: getDateString,
  expires: true,
  lastUpdatedAt: getDateStringIfPresent,
  lastUpdatedBy: agentExtractorIfPresent,
  presets: assignedPresetsListExtractor,
  tokenStr: true,
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
  action: BasicCRUDActions,
  nothrow = false
) {
  const organization = await checkOrganizationExists(
    context,
    token.organizationId
  );

  await checkAuthorization({
    context,
    agent,
    organization,
    resource: token,
    action,
    nothrow,
    type: AppResourceType.ClientAssignedToken,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
  });

  return {agent, token, organization};
}

export async function checkClientAssignedTokenAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  tokenId: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const token = await context.data.clientAssignedToken.assertGetItem(
    EndpointReusableQueries.getById(tokenId)
  );

  return checkClientAssignedTokenAuthorization(
    context,
    agent,
    token,
    action,
    nothrow
  );
}

export async function checkClientAssignedTokenAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  input: {
    tokenId?: string;
    providedResourceId?: string;
    organizationId?: string;
    onReferenced?: boolean;
  },
  action: BasicCRUDActions,
  nothrow = false
) {
  const tokenId = getClientAssignedTokenIdNoThrow(
    agent,
    input.tokenId,
    input.onReferenced
  );

  if (!tokenId && !input.providedResourceId) {
    throw new InvalidRequestError(
      'Client assigned token ID or providedResourceId not set'
    );
  }

  let token: IClientAssignedToken | null = null;

  if (tokenId) {
    token = await context.data.clientAssignedToken.assertGetItem(
      EndpointReusableQueries.getById(tokenId)
    );
  } else if (input.providedResourceId) {
    const organizationId =
      input.organizationId || assertGetOrganizationIdFromAgent(agent);

    token = await context.data.clientAssignedToken.assertGetItem(
      EndpointReusableQueries.getByProvidedId(
        organizationId,
        input.providedResourceId
      )
    );
  }

  assert(token, new ClientAssignedTokenDoesNotExistError());
  return checkClientAssignedTokenAuthorization(
    context,
    agent,
    token,
    action,
    nothrow
  );
}

export function throwClientAssignedTokenNotFound() {
  throw new NotFoundError('Client assigned token not found');
}

export abstract class ClientAssignedTokenUtils {
  static extractPublicToken = clientAssignedTokenExtractor;
  static extractPublicTokenList = clientAssignedTokenListExtractor;
}

export function getPublicClientToken(
  context: IBaseContext,
  token: IClientAssignedToken
) {
  const tokenStr = context.session.encodeToken(
    context,
    token.resourceId,
    TokenType.ProgramAccessToken
  );

  cast<IPublicClientAssignedToken>(token).tokenStr = tokenStr;
  return ClientAssignedTokenUtils.extractPublicToken(token);
}
