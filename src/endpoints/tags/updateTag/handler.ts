import {BasicCRUDActions} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {getDateString} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import EndpointReusableQueries from '../../queries';
import {checkTagNameExists} from '../checkTagNameExists';
import {checkTagAuthorization02, tagExtractor} from '../utils';
import {UpdateTagEndpoint} from './types';
import {updateTagJoiSchema} from './validation';

const updateTag: UpdateTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const checkResult = await checkTagAuthorization02(context, agent, data.tagId, BasicCRUDActions.Read);

  const workspace = checkResult.workspace;
  let tag = checkResult.tag;
  const tagUpdate: Partial<ITag> = {
    ...data.tag,
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  if (tagUpdate.name && tagUpdate.name !== tag.name) {
    await checkTagNameExists(context, workspace.resourceId, tagUpdate.name);
  }

  tag = await context.data.tag.assertGetAndUpdateOneByQuery(
    EndpointReusableQueries.getByResourceId(data.tagId),
    tagUpdate
  );

  return {
    tag: tagExtractor(tag),
  };
};

export default updateTag;
