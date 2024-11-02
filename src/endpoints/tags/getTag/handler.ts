import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {checkTagAuthorization02, tagExtractor} from '../utils.js';
import {GetTagEndpoint} from './types.js';
import {getTagJoiSchema} from './validation.js';

const getTag: GetTagEndpoint = async reqData => {
  const data = validate(reqData.data, getTagJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const {tag} = await checkTagAuthorization02(agent, data.tagId, 'readTag');
  return {tag: tagExtractor(tag)};
};

export default getTag;
