import {PublicUser, User, UserWithWorkspace, UserWorkspace} from '../../definitions/user';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {EmailAddressNotAvailableError} from './errors';

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
  requiresPasswordChange: true,
  workspaces: userWorkspaceListExtractor,
  isOnWaitlist: true,
});

export const userExtractor = makeExtract(publicUserFields);
export const userListExtractor = makeListExtract(publicUserFields);

export function throwUserNotFound() {
  throw kReuseableErrors.user.notFound();
}

export function isUserInWorkspace(user: UserWithWorkspace, workspaceId: string) {
  return user.workspaces.some(workspace => workspace.workspaceId === workspaceId);
}

export function assertUser(user?: User | null): asserts user {
  appAssert(user, kReuseableErrors.user.notFound());
}

export async function getCompleteUserDataByEmail(
  email: string,
  opts?: SemanticProviderRunOptions
) {
  const user = await kSemanticModels.user().getByEmail(email, opts);
  assertUser(user);
  return await populateUserWorkspaces(user);
}

export async function assertEmailAddressAvailable(
  email: string,
  opts?: SemanticProviderRunOptions
) {
  const userExists = await kSemanticModels.user().existsByEmail(email, opts);
  if (userExists) {
    throw new EmailAddressNotAvailableError();
  }
}
