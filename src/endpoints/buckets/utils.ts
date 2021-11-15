import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {agentExtractor} from '../utils';
import {IPublicBucket} from './types';

const bucketFields = getFields<IPublicBucket>({
  bucketId: true,
  organizationId: true,
  environmentId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  maxFileSize: true,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
});

export const bucketExtractor = makeExtract(bucketFields);
export const bucketListExtractor = makeListExtract(bucketFields);

export class BucketUtils {
  static extractPublicBucket = bucketExtractor;
  static extractPublicBucketList = bucketListExtractor;
}
