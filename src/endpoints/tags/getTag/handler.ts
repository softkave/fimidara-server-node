import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {checkTagAuthorization02, tagExtractor} from '../utils.js';
import {GetTagEndpoint} from './types.js';
import {getTagJoiSchema} from './validation.js';

const getTag: GetTagEndpoint = async reqData => {
  const data = validate(reqData.data, getTagJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {tag} = await checkTagAuthorization02(agent, data.tagId, 'readTag');
  return {tag: tagExtractor(tag)};
};

export default getTag;
