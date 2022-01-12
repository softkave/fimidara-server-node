import {IBucket} from '../../../definitions/bucket';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import BucketQueries from '../queries';
import {BucketUtils} from '../utils';
import {UpdateBucketEndpoint} from './types';
import {updateBucketJoiSchema} from './validation';

const updateBucket: UpdateBucketEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateBucketJoiSchema);
  const user = await context.session.getUser(context, instData);
  const bucket: IBucket = await context.data.bucket.assertUpdateItem(
    BucketQueries.getById(data.bucketId),
    {
      ...data.bucket,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: user.resourceId,
        agentType: SessionAgentType.User,
      },
    }
  );

  return {
    bucket: BucketUtils.extractPublicBucket(bucket),
  };
};

export default updateBucket;
