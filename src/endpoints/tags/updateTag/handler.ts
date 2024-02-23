import {Tag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkTagNameExists} from '../checkTagNameExists';
import {assertTag, checkTagAuthorization02, tagExtractor} from '../utils';
import {UpdateTagEndpoint} from './types';
import {updateTagJoiSchema} from './validation';

const updateTag: UpdateTagEndpoint = async instData => {
  const data = validate(instData.data, updateTagJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace, tag: tag_} = await checkTagAuthorization02(
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
  tag = await kSemanticModels.utils().withTxn(async opts => {
    if (tagUpdate.name && tagUpdate.name !== tag.name)
      await checkTagNameExists(workspace.resourceId, tagUpdate.name, opts);
    const updatedTag = await kSemanticModels
      .tag()
      .getAndUpdateOneById(data.tagId, tagUpdate, opts);
    assertTag(updatedTag);
    return updatedTag;
  });

  return {tag: tagExtractor(tag)};
};

export default updateTag;
