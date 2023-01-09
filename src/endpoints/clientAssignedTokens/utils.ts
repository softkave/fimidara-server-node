import {IClientAssignedToken, IPublicClientAssignedToken} from '../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions, ISessionAgent, TokenType} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getDateString} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {cast} from '../../utils/fns';
import {checkAuthorization, makeWorkspacePermissionOwnerList} from '../contexts/authorization-checks/checkAuthorizaton';
import {assertGetWorkspaceIdFromAgent, getClientAssignedTokenIdNoThrow} from '../contexts/SessionContext';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError, NotFoundError} from '../errors';
import {assignedPermissionGroupsListExtractor} from '../permissionGroups/utils';
import EndpointReusableQueries from '../queries';
import {agentExtractor} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {ClientAssignedTokenDoesNotExistError} from './errors';

const clientAssignedTokenFields = getFields<IPublicClientAssignedToken>({
  resourceId: true,
  providedResourceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  workspaceId: true,
  expires: getDateString,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
  permissionGroups: assignedPermissionGroupsListExtractor,
  tokenStr: true,
  // tags: assignedTagListExtractor,
  name: true,
  description: true,
});

export const clientAssignedTokenExtractor = makeExtract(clientAssignedTokenFields);
export const clientAssignedTokenListExtractor = makeListExtract(clientAssignedTokenFields);

export async function checkClientAssignedTokenAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  token: IClientAssignedToken,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, token.workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    resource: token,
    action,
    nothrow,
    type: AppResourceType.ClientAssignedToken,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
  });

  return {agent, token, workspace};
}

export async function checkClientAssignedTokenAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  tokenId: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const token = await context.data.clientAssignedToken.assertGetOneByQuery(EndpointReusableQueries.getById(tokenId));
  return checkClientAssignedTokenAuthorization(context, agent, token, action, nothrow);
}

export async function checkClientAssignedTokenAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  input: {
    tokenId?: string;
    providedResourceId?: string;
    workspaceId?: string;
    onReferenced?: boolean;
  },
  action: BasicCRUDActions,
  nothrow = false
) {
  const tokenId = getClientAssignedTokenIdNoThrow(agent, input.tokenId, input.onReferenced);

  if (!tokenId && !input.providedResourceId) {
    throw new InvalidRequestError('Client assigned token ID or providedResourceId not set');
  }

  let token: IClientAssignedToken | null = null;

  if (tokenId) {
    token = await context.data.clientAssignedToken.assertGetOneByQuery(EndpointReusableQueries.getById(tokenId));
  } else if (input.providedResourceId) {
    const workspaceId = input.workspaceId || assertGetWorkspaceIdFromAgent(agent);

    token = await context.data.clientAssignedToken.assertGetOneByQuery(
      EndpointReusableQueries.getByProvidedId(workspaceId, input.providedResourceId)
    );
  }

  appAssert(token, new ClientAssignedTokenDoesNotExistError());
  return checkClientAssignedTokenAuthorization(context, agent, token, action, nothrow);
}

export function throwClientAssignedTokenNotFound() {
  throw new NotFoundError('Client assigned token not found');
}

export function getPublicClientToken(context: IBaseContext, token: IClientAssignedToken) {
  const tokenStr = context.session.encodeToken(
    context,
    token.resourceId,
    TokenType.ClientAssignedToken,
    token.expires,
    token.createdAt
  );

  cast<IPublicClientAssignedToken>(token).tokenStr = tokenStr;
  return clientAssignedTokenExtractor(token);
}
