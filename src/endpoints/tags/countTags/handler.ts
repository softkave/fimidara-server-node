import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils.js';
import {getWorkspaceTagsQuery} from '../getTags/utils.js';
import {CountTagsEndpoint} from './types.js';
import {countWorkspaceTagJoiSchema} from './validation.js';

const countTags: CountTagsEndpoint = async reqData => {
  const data = validate(reqData.data, countWorkspaceTagJoiSchema);
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
  const q = await getWorkspaceTagsQuery(agent, workspace);
  const count = await kSemanticModels.tag().countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countTags;
