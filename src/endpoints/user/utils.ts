import {IPublicUserData, IUserWorkspace} from '../../definitions/user';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {NotFoundError} from '../errors';
import {assignedPresetsListExtractor} from '../presetPermissionsGroups/utils';

const publicUserWorkspaceFields = getFields<IUserWorkspace>({
  workspaceId: true,
  joinedAt: getDateString,
  presets: assignedPresetsListExtractor,
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
  lastUpdatedAt: getDateStringIfPresent,
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
