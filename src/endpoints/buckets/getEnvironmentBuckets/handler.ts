import {validate} from '../../../utilities/validate';
import BucketQueries from '../queries';
import {BucketUtils} from '../utils';
import {GetEnvironmentBucketEndpoint} from './types';
import {getEnvironmentBucketJoiSchema} from './validation';

const getenvironmentBucket: GetEnvironmentBucketEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getEnvironmentBucketJoiSchema);
  const user = await context.session.getUser(context, instData);
  const tokens = await context.data.bucket.getManyItems(
    BucketQueries.getByEnvironmentId(data.environmentId)
  );

  return {
    buckets: BucketUtils.extractPublicBucketList(tokens),
  };
};

export default getenvironmentBucket;
