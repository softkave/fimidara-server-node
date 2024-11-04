import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getTagsQuery} from '../getTags/utils.js';
import {CountTagsEndpoint} from './types.js';
import {countWorkspaceTagJoiSchema} from './validation.js';

const countTags: CountTagsEndpoint = async reqData => {
  const data = validate(reqData.data, countWorkspaceTagJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {data});

  const q = await getTagsQuery(agent, workspace);
  const count = await kSemanticModels.tag().countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countTags;
