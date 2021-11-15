import {IBucket} from '../../../definitions/bucket';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {BucketUtils} from '../utils';
import {AddBucketEndpoint} from './types';
import {addBucketJoiSchema} from './validation';

const addBucket: AddBucketEndpoint = async (context, instData) => {
  const data = validate(instData.data, addBucketJoiSchema);
  const user = await context.session.getUser(context, instData);
  const bucket: IBucket = await context.data.bucket.saveItem({
    ...data.bucket,
    bucketId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: user.userId,
      agentType: SessionAgentType.User,
    },
  });

  return {
    bucket: BucketUtils.extractPublicBucket(bucket),
  };
};

export default addBucket;
