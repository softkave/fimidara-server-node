import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract} from '../../utilities/extract';
import {IPublicUserData} from './types';

const publicUserFields = getFields<IPublicUserData>({
  userId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  createdAt: getDateString,
  lastUpdatedAt: getDateString,
  isEmailVerified: true,
  emailVerifiedAt: getDateString,
});

export const userExtractor = makeExtract(publicUserFields);
