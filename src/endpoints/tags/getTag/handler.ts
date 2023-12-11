import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {checkTagAuthorization02, tagExtractor} from '../utils';
import {GetTagEndpoint} from './types';
import {getTagJoiSchema} from './validation';

const getTag: GetTagEndpoint = async instData => {
  const data = validate(instData.data, getTagJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {tag} = await checkTagAuthorization02(agent, data.tagId, 'readTag');
  return {tag: tagExtractor(tag)};
};

export default getTag;
