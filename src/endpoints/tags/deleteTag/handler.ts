import {AppActionType, AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {checkTagAuthorization02} from '../utils';
import {DeleteTagEndpoint} from './types';
import {deleteTagJoiSchema} from './validation';

const deleteTag: DeleteTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {tag} = await checkTagAuthorization02(context, agent, data.tagId, AppActionType.Delete);
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.Tag,
    args: {
      workspaceId: tag.workspaceId,
      resourceId: tag.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deleteTag;
