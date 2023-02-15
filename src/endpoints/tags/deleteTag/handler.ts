import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import EndpointReusableQueries from '../../queries';
import {checkTagAuthorization02} from '../utils';
import {DeleteTagEndpoint} from './types';
import {deleteTagJoiSchema} from './validation';

const deleteTag: DeleteTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {tag} = await checkTagAuthorization02(context, agent, data.tagId, BasicCRUDActions.Delete);

  await waitOnPromises([
    context.data.tag.deleteOneByQuery(EndpointReusableQueries.getByResourceId(tag.resourceId)),
  ]);
};

export default deleteTag;
