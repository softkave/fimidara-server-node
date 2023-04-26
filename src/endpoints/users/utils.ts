import {PublicUser, User, UserWithWorkspace, UserWorkspace} from '../../definitions/user';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {reuseableErrors} from '../../utils/reusableErrors';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {BaseContextType} from '../contexts/types';

const publicUserWorkspaceFields = getFields<UserWorkspace>({
  workspaceId: true,
  joinedAt: true,
});

export const userWorkspaceExtractor = makeExtract(publicUserWorkspaceFields);
export const userWorkspaceListExtractor = makeListExtract(publicUserWorkspaceFields);

const publicUserFields = getFields<PublicUser>({
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
});

export const userExtractor = makeExtract(publicUserFields);

export function throwUserNotFound() {
  throw reuseableErrors.user.notFound();
}

export function isUserInWorkspace(user: UserWithWorkspace, workspaceId: string) {
  return user.workspaces.some(workspace => workspace.workspaceId === workspaceId);
}

export function assertUser(user?: User | null): asserts user {
  appAssert(user, reuseableErrors.user.notFound());
}

export async function getUserWithWorkspaceById(context: BaseContextType, userId: string) {
  const user = await context.semantic.user.getOneById(userId);
  assertUser(user);
  return await populateUserWorkspaces(context, user);
}

export async function getCompleteUserDataByEmail(context: BaseContextType, email: string) {
  const user = await context.semantic.user.getByEmail(email);
  assertUser(user);
  return await populateUserWorkspaces(context, user);
}
