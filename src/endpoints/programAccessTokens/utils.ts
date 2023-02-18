import {IProgramAccessToken, IPublicProgramAccessToken} from '../../definitions/programAccessToken';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
  TokenType,
} from '../../definitions/system';
import {getDateString} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {cast} from '../../utils/fns';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {assignedPermissionGroupsListExtractor} from '../permissionGroups/utils';
import EndpointReusableQueries from '../queries';
import {agentExtractor} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';

const programAccessTokenFields = getFields<IPublicProgramAccessToken>({
  resourceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  workspaceId: true,
  name: true,
  description: true,
  permissionGroups: assignedPermissionGroupsListExtractor,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
  tokenStr: true,
  // tags: assignedTagListExtractor,
});

export const programAccessTokenExtractor = makeExtract(programAccessTokenFields);

export const programAccessTokenListExtractor = makeListExtract(programAccessTokenFields);

export async function checkProgramAccessTokenAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  token: IProgramAccessToken,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, token.workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    targetId: token.resourceId,
    type: AppResourceType.ProgramAccessToken,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  return {agent, token, workspace};
}

export async function checkProgramAccessTokenAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const token = await context.data.programAccessToken.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(id)
  );
  return checkProgramAccessTokenAuthorization(context, agent, token, action, nothrow);
}

export function throwProgramAccessTokenNotFound() {
  throw new NotFoundError('Program access token not found');
}

export function getPublicProgramToken(context: IBaseContext, token: IProgramAccessToken) {
  const tokenStr = context.session.encodeToken(
    context,
    token.resourceId,
    TokenType.ProgramAccessToken,
    null,
    token.createdAt
  );

  cast<IPublicProgramAccessToken>(token).tokenStr = tokenStr;
  return programAccessTokenExtractor(token);
}
