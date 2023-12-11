import {AppResourceTypeMap} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkTagAuthorization02} from '../utils';
import {DeleteTagEndpoint} from './types';
import {deleteTagJoiSchema} from './validation';

const deleteTag: DeleteTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {tag} = await checkTagAuthorization02(context, agent, data.tagId, 'deleteTag');

  const job = await enqueueDeleteResourceJob({
    type: AppResourceTypeMap.Tag,
    args: {workspaceId: tag.workspaceId, resourceId: tag.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteTag;
