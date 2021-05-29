import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicAuthKey} from './types';

const authKeyFields = getFields<IPublicAuthKey>({
    publicKey: true,
    authToken: true,
    createdAt: getDateString,
    createdBy: true,
    organizationId: true,
});

export const authKeyExtractor = makeExtract(authKeyFields);
export const authKeyListExtractor = makeListExtract(authKeyFields);
