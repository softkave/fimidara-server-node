import {Tag} from '../../../definitions/tag.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {checkTagNameExists} from '../checkTagNameExists.js';
import {assertTag, checkTagAuthorization02, tagExtractor} from '../utils.js';
import {UpdateTagEndpoint} from './types.js';
import {updateTagJoiSchema} from './validation.js';

const updateTag: UpdateTagEndpoint = async reqData => {
  const data = validate(reqData.data, updateTagJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
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
