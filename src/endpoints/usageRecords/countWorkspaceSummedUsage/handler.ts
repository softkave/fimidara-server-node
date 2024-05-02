import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceSummedUsageQuery} from '../getWorkspaceSummedUsage/utils.js';
import {CountWorkspaceSummedUsageEndpoint} from './types.js';
import {countWorkspaceSummedUsageJoiSchema} from './validation.js';

const countWorkspaceSummedUsage: CountWorkspaceSummedUsageEndpoint = async instData => {
  const data = validate(instData.data, countWorkspaceSummedUsageJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {query} = await getWorkspaceSummedUsageQuery(agent, workspaceId, data);
  const count = await kSemanticModels.usageRecord().countByQuery(query);
  return {count};
};

export default countWorkspaceSummedUsage;
