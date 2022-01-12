import {IUserOrganization} from '../../definitions/user';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {NotFoundError} from '../errors';
import {assignedPresetsListExtractor} from '../presetPermissionsGroups/utils';
import {IPublicUserData} from './types';

const publicUserOrgFields = getFields<IUserOrganization>({
  organizationId: true,
  joinedAt: getDateString,
  presets: assignedPresetsListExtractor,
});

export const userOrgExtractor = makeExtract(publicUserOrgFields);
export const userOrgListExtractor = makeListExtract(publicUserOrgFields);

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
  organizations: userOrgListExtractor,
  passwordLastChangedAt: getDateString,
});

export const userExtractor = makeExtract(publicUserFields);

export function throwUserNotFound() {
  throw new NotFoundError('User not found');
}

export function throwUserTokenNotFound() {
  throw new NotFoundError('User token not found');
}
