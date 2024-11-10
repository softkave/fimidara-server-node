import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {PublicUser, User, UserWithWorkspace} from '../../definitions/user.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {ResourceExistsError} from '../errors.js';
import {workspaceResourceFields} from '../extractors.js';

const publicUserFields = getFields<PublicUser>({
  ...workspaceResourceFields,
  firstName: true,
  lastName: true,
  email: true,
  isEmailVerified: true,
  emailVerifiedAt: true,
  emailVerificationEmailSentAt: true,
  passwordLastChangedAt: true,
  requiresPasswordChange: true,
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

export async function checkEmailAddressAvailability(
  params: {email: string; workspaceId?: string},
  opts?: SemanticProviderOpParams
) {
  const userExists = await kSemanticModels.user().existsByEmail(params, opts);
  if (userExists) {
    throw new ResourceExistsError('Email address is not available');
  }
}
