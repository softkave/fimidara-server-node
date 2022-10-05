import {
  IPublicUserData,
  IUser,
  IUserWithWorkspace,
  IUserWorkspace,
} from '../../definitions/user';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {assignedPermissionGroupsListExtractor} from '../permissionGroups/utils';
import {userCommonErrors} from './errors';
import UserQueries from './UserQueries';

const publicUserWorkspaceFields = getFields<IUserWorkspace>({
  workspaceId: true,
  joinedAt: getDateString,
  permissionGroups: assignedPermissionGroupsListExtractor,
});

export const userWorkspaceExtractor = makeExtract(publicUserWorkspaceFields);
export const userWorkspaceListExtractor = makeListExtract(
  publicUserWorkspaceFields
);

const publicUserFields = getFields<IPublicUserData>({
  resourceId: true,
  firstName: true,
  lastName: true,
  email: true,
  createdAt: getDateString,
  lastUpdatedAt: getDateString,
  isEmailVerified: true,
  emailVerifiedAt: getDateStringIfPresent,
  emailVerificationEmailSentAt: getDateStringIfPresent,
  workspaces: userWorkspaceListExtractor,
  passwordLastChangedAt: getDateString,
});

export const userExtractor = makeExtract(publicUserFields);

export function throwUserNotFound() {
  throw new NotFoundError('User not found');
}

export function throwUserTokenNotFound() {
  throw new NotFoundError('User token not found');
}

export function isUserInWorkspace(
  user: IUserWithWorkspace,
  workspaceId: string
) {
  return user.workspaces.some(
    workspace => workspace.workspaceId === workspaceId
  );
}

export function assertUser(user?: IUser | null): asserts user {
  if (!user) {
    userCommonErrors.notFound();
  }
}

export async function getUserWithWorkspaceById(
  context: IBaseContext,
  userId: string
) {
  const user = await context.data.user.getItem(UserQueries.getById(userId));
  assertUser(user);
  return await populateUserWorkspaces(context, user);
}

export async function getCompleteUserDataByEmail(
  context: IBaseContext,
  email: string
) {
  const user = await context.data.user.getItem(UserQueries.getByEmail(email));
  assertUser(user);
  return await populateUserWorkspaces(context, user);
}
