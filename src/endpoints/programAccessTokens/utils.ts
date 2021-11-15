import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicProgramAccessToken} from './types';

const programAccessTokenFields = getFields<IPublicProgramAccessToken>({
  tokenId: true,
  hash: true,
  createdAt: getDateString,
  createdBy: true,
  organizationId: true,
  environmentId: true,
});

export const programAccessTokenExtractor = makeExtract(
  programAccessTokenFields
);

export const programAccessTokenListExtractor = makeListExtract(
  programAccessTokenFields
);

export abstract class ProgramAccessTokenUtils {
  static extractPublicToken = programAccessTokenExtractor;
  static extractPublicTokenList = programAccessTokenListExtractor;
}
