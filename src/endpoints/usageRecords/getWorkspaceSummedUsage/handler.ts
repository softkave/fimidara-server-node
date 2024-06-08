import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {usageRecordListExtractor} from '../utils.js';
import {GetWorkspaceSummedUsageEndpoint} from './types.js';
import {getWorkspaceSummedUsageQuery} from './utils.js';
import {getWorkspaceSummedUsageJoiSchema} from './validation.js';

const getWorkspaceSummedUsage: GetWorkspaceSummedUsageEndpoint = async instData => {
  const data = validate(instData.data, getWorkspaceSummedUsageJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  applyDefaultEndpointPaginationOptions(data);
  const {query} = await getWorkspaceSummedUsageQuery(agent, workspaceId, data);
  const records = await kSemanticModels.usageRecord().getManyByQuery(query, data);
  return {
    page: getEndpointPageFromInput(data),
    records: usageRecordListExtractor(records),
  };
};

export default getWorkspaceSummedUsage;
