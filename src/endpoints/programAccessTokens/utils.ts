import {
  IProgramAccessToken,
  IPublicProgramAccessToken,
} from '../../definitions/programAccessToken';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import cast from '../../utilities/fns';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {TokenType} from '../contexts/SessionContext';
import {NotFoundError} from '../errors';
import {checkWorkspaceExists} from '../workspaces/utils';
import {assignedPresetsListExtractor} from '../presetPermissionsGroups/utils';
import {assignedTagListExtractor} from '../tags/utils';
import {agentExtractor} from '../utils';
import ProgramAccessTokenQueries from './queries';

const programAccessTokenFields = getFields<IPublicProgramAccessToken>({
  resourceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  workspaceId: true,
  name: true,
  description: true,
  presets: assignedPresetsListExtractor,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
  tokenStr: true,
  tags: assignedTagListExtractor,
});

export const programAccessTokenExtractor = makeExtract(
  programAccessTokenFields
);

export const programAccessTokenListExtractor = makeListExtract(
  programAccessTokenFields
);

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
    resource: token,
    type: AppResourceType.ProgramAccessToken,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
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
  const token = await context.data.programAccessToken.assertGetItem(
    ProgramAccessTokenQueries.getById(id)
  );

  return checkProgramAccessTokenAuthorization(
    context,
    agent,
    token,
    action,
    nothrow
  );
}

export function throwProgramAccessTokenNotFound() {
  throw new NotFoundError('Program access token not found');
}

export function getPublicProgramToken(
  context: IBaseContext,
  token: IProgramAccessToken
) {
  const tokenStr = context.session.encodeToken(
    context,
    token.resourceId,
    TokenType.ProgramAccessToken
  );

  cast<IPublicProgramAccessToken>(token).tokenStr = tokenStr;
  return programAccessTokenExtractor(token);
}
