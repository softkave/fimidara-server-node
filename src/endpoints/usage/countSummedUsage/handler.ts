import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceSummedUsageQuery} from '../getSummedUsage/utils.js';
import {CountSummedUsageEndpoint} from './types.js';
import {countSummedUsageJoiSchema} from './validation.js';

const countSummedUsage: CountSummedUsageEndpoint = async reqData => {
  const data = validate(reqData.data, countSummedUsageJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {query} = await getWorkspaceSummedUsageQuery(agent, workspaceId, data);
  const count = await kSemanticModels.usageRecord().countByQuery(query);
  return {count};
};

export default countSummedUsage;
