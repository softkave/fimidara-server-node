import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {PublicUser, User, UserWithWorkspace} from '../../definitions/user.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems.js';
import {resourceFields, workspaceResourceListExtractor} from '../extractors.js';
import {EmailAddressNotAvailableError} from './errors.js';

const publicUserFields = getFields<PublicUser>({
  ...resourceFields,
  firstName: true,
  lastName: true,
  email: true,
  isEmailVerified: true,
  emailVerifiedAt: true,
  emailVerificationEmailSentAt: true,
  passwordLastChangedAt: true,
  requiresPasswordChange: true,
  workspaces: workspaceResourceListExtractor,
  isOnWaitlist: true,
});

export const userExtractor = makeExtract(publicUserFields);
export const userListExtractor = makeListExtract(publicUserFields);

export function throwUserNotFound() {
  throw kReuseableErrors.user.notFound();
}

export function isUserInWorkspace(
  user: UserWithWorkspace,
  workspaceId: string
) {
  return user.workspaces.some(
    workspace => workspace.workspaceId === workspaceId
  );
}

export function assertUser(user?: User | null): asserts user {
  appAssert(user, kReuseableErrors.user.notFound());
}

export async function getCompleteUserDataByEmail(
  email: string,
  opts?: SemanticProviderOpParams
) {
  const user = await kIjxSemantic.user().getByEmail(email, opts);
  assertUser(user);
  return await populateUserWorkspaces(user);
}

export async function assertEmailAddressAvailable(
  email: string,
  opts?: SemanticProviderOpParams
) {
  const userExists = await kIjxSemantic.user().existsByEmail(email, opts);
  if (userExists) {
    throw new EmailAddressNotAvailableError();
  }
}
