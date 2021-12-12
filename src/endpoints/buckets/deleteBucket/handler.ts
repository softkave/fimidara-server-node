import {validate} from '../../../utilities/validate';
import BucketQueries from '../queries';
import {DeleteBucketEndpoint} from './types';
import {deleteBucketJoiSchema} from './validation';

const deleteBucket: DeleteBucketEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteBucketJoiSchema);
  await context.session.getUser(context, instData);
  // await context.data.bucket.deleteItem(BucketQueries.getById(data.bucketId));
  // TODO: delete artifacts
};

export default deleteBucket;
