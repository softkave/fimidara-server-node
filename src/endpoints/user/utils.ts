import {IPublicUserData, IUser, IUserWithWorkspace, IUserWorkspace} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {reuseableErrors} from '../../utils/reusableErrors';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {agentExtractor} from '../utils';
import UserQueries from './UserQueries';

const publicUserWorkspaceFields = getFields<IUserWorkspace>({
  workspaceId: true,
  joinedAt: true,
});

export const userWorkspaceExtractor = makeExtract(publicUserWorkspaceFields);
export const userWorkspaceListExtractor = makeListExtract(publicUserWorkspaceFields);

const publicUserFields = getFields<IPublicUserData>({
  resourceId: true,
  firstName: true,
  lastName: true,
  email: true,
  createdAt: true,
  lastUpdatedAt: true,
  isEmailVerified: true,
  emailVerifiedAt: true,
  emailVerificationEmailSentAt: true,
  passwordLastChangedAt: true,
  workspaces: userWorkspaceListExtractor,
  createdBy: agentExtractor,
  lastUpdatedBy: agentExtractor,
});

export const userExtractor = makeExtract(publicUserFields);

export function throwUserNotFound() {
  throw new NotFoundError('User not found');
}

export function throwUserTokenNotFound() {
  throw new NotFoundError('User token not found');
}

export function isUserInWorkspace(user: IUserWithWorkspace, workspaceId: string) {
  return user.workspaces.some(workspace => workspace.workspaceId === workspaceId);
}

export function assertUser(user?: IUser | null): asserts user {
  appAssert(user, reuseableErrors.user.notFound());
}

export function assertUserToken(userToken?: IUserToken | null): asserts userToken {
  appAssert(userToken, reuseableErrors.credentials.invalidCredentials());
}

export async function getUserWithWorkspaceById(context: IBaseContext, userId: string) {
  const user = await context.data.user.getOneByQuery(UserQueries.getById(userId));
  assertUser(user);
  return await populateUserWorkspaces(context, user);
}

export async function getCompleteUserDataByEmail(context: IBaseContext, email: string) {
  const user = await context.data.user.getOneByQuery(UserQueries.getByEmail(email));
  assertUser(user);
  return await populateUserWorkspaces(context, user);
}
