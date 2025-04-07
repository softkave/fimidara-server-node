import {makeExtract, makeListExtract} from 'softkave-js-utils';
import {PublicPart} from '../../../definitions/file.js';
import {getFields} from '../../../utils/extract.js';

const extractPartDetailFields = getFields<PublicPart>({
  part: true,
  size: true,
});

export const partDetailsExtractor = makeExtract(extractPartDetailFields);
export const partDetailsListExtractor = makeListExtract(
  extractPartDetailFields
);
