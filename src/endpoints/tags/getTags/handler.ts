import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils.js';
import {tagExtractor} from '../utils.js';
import {GetTagsEndpoint} from './types.js';
import {getTagsQuery} from './utils.js';
import {getTagsJoiSchema} from './validation.js';

const getTags: GetTagsEndpoint = async reqData => {
  const data = validate(reqData.data, getTagsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const workspace = await checkWorkspaceExistsWithAgent(
    agent,
    data.workspaceId
  );
  const q = await getTagsQuery(agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const tags = await kSemanticModels.tag().getManyByWorkspaceAndIdList(q, data);
  return {
    tags: tags.map(tag => tagExtractor(tag)),
    page: getEndpointPageFromInput(data),
  };
};

export default getTags;
