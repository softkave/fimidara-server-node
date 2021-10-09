import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicClientAssignedToken} from './types';

const clientAssignedTokenFields = getFields<IPublicClientAssignedToken>({});

export const clientAssignedTokenExtractor = makeExtract(
  clientAssignedTokenFields
);
export const clientAssignedTokenListExtractor = makeListExtract(
  clientAssignedTokenFields
);
