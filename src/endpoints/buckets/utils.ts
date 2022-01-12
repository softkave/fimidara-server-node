import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {IPublicBucket} from './types';

const bucketFields = getFields<IPublicBucket>({
  resourceId: true,
  organizationId: true,
  environmentId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  maxFileSize: true,
  lastUpdatedBy: agentExtractorIfPresent,
  lastUpdatedAt: getDateStringIfPresent,
  name: true,
  description: true,
});

export const bucketExtractor = makeExtract(bucketFields);
export const bucketListExtractor = makeListExtract(bucketFields);

export class BucketUtils {
  static extractPublicBucket = bucketExtractor;
  static extractPublicBucketList = bucketListExtractor;
}
