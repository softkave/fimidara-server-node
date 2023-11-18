import {Tag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkTagNameExists} from '../checkTagNameExists';
import {assertTag, checkTagAuthorization02, tagExtractor} from '../utils';
import {UpdateTagEndpoint} from './types';
import {updateTagJoiSchema} from './validation';

const updateTag: UpdateTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace, tag: tag_} = await checkTagAuthorization02(
    context,
    agent,
    data.tagId,
    'updateTag'
  );
  const tagUpdate: Partial<Tag> = {
    ...data.tag,
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  let tag = tag_;
  tag = await context.semantic.utils.withTxn(context, async opts => {
    if (tagUpdate.name && tagUpdate.name !== tag.name)
      await checkTagNameExists(context, workspace.resourceId, tagUpdate.name, opts);
    const updatedTag = await context.semantic.tag.getAndUpdateOneById(
      data.tagId,
      tagUpdate,
      opts
    );
    assertTag(updatedTag);
    return updatedTag;
  });

  return {tag: tagExtractor(tag)};
};

export default updateTag;
