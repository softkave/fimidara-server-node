import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {agentExtractor} from '../utils';
import {IPublicClientAssignedToken} from './types';

const clientAssignedTokenFields = getFields<IPublicClientAssignedToken>({
  tokenId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  organizationId: true,
  environmentId: true,
  version: true,
  issuedAt: getDateString,
  expires: true,
});

export const clientAssignedTokenExtractor = makeExtract(
  clientAssignedTokenFields
);

export const clientAssignedTokenListExtractor = makeListExtract(
  clientAssignedTokenFields
);

export abstract class ClientAssignedTokenUtils {
  static extractPublicToken = clientAssignedTokenExtractor;
  static extractPublicTokenList = clientAssignedTokenListExtractor;
}
