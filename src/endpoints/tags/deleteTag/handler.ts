import {kAppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkTagAuthorization02} from '../utils';
import {DeleteTagEndpoint} from './types';
import {deleteTagJoiSchema} from './validation';

const deleteTag: DeleteTagEndpoint = async instData => {
  const data = validate(instData.data, deleteTagJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {tag} = await checkTagAuthorization02(agent, data.tagId, 'deleteTag');

  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.Tag,
    args: {workspaceId: tag.workspaceId, resourceId: tag.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteTag;
