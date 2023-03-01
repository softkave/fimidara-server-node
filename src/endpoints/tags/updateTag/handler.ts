import {BasicCRUDActions} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkTagNameExists} from '../checkTagNameExists';
import {checkTagAuthorization02, tagExtractor} from '../utils';
import {UpdateTagEndpoint} from './types';
import {updateTagJoiSchema} from './validation';

const updateTag: UpdateTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {workspace, tag} = await checkTagAuthorization02(
    context,
    agent,
    data.tagId,
    BasicCRUDActions.Read
  );
  const tagUpdate: Partial<ITag> = {
    ...data.tag,
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  if (tagUpdate.name && tagUpdate.name !== tag.name) {
    await checkTagNameExists(context, workspace.resourceId, tagUpdate.name);
  }

  tag = await context.semantic.tag.getAndUpdateOneById(data.tagId, tagUpdate);
  return {tag: tagExtractor(tag)};
};

export default updateTag;
