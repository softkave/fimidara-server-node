import {IProgramAccessToken, IPublicProgramAccessToken} from '../../definitions/programAccessToken';
import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {cast} from '../../utils/fns';
import {reuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import EndpointReusableQueries from '../queries';
import {workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';

const programAccessTokenFields = getFields<IPublicProgramAccessToken>({
  ...workspaceResourceFields,
  name: true,
  description: true,
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
    action,
    nothrow,
    workspaceId: workspace.resourceId,
    targets: [{targetId: token.resourceId}],
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
  const tokenStr = context.session.encodeToken(context, token.resourceId, null, token.createdAt);
  cast<IPublicProgramAccessToken>(token).tokenStr = tokenStr;
  return programAccessTokenExtractor(token);
}

export function assertProgramToken(token?: IProgramAccessToken | null): asserts token {
  appAssert(token, reuseableErrors.programToken.notFound());
}
