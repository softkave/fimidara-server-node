import {validate} from '../../../utilities/validate';
import BucketQueries from '../queries';
import {BucketUtils} from '../utils';
import {GetBucketEndpoint} from './types';
import {getBucketJoiSchema} from './validation';

const getBucket: GetBucketEndpoint = async (context, instData) => {
  const data = validate(instData.data, getBucketJoiSchema);
  const user = await context.session.getUser(context, instData);
  const token = await context.data.bucket.assertGetItem(
    BucketQueries.getById(data.bucketId)
  );

  return {
    bucket: BucketUtils.extractPublicBucket(token),
  };
};

export default getBucket;
