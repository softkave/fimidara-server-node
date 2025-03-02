import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {usageRecordListExtractor} from '../utils.js';
import {GetWorkspaceSummedUsageEndpoint} from './types.js';
import {getWorkspaceSummedUsageQuery} from './utils.js';
import {getWorkspaceSummedUsageJoiSchema} from './validation.js';

const getWorkspaceSummedUsage: GetWorkspaceSummedUsageEndpoint =
  async reqData => {
    const data = validate(reqData.data, getWorkspaceSummedUsageJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
    applyDefaultEndpointPaginationOptions(data);
    const {query} = await getWorkspaceSummedUsageQuery(
      agent,
      workspaceId,
      data
    );
    const records = await kIjxSemantic
      .usageRecord()
      .getManyByQuery(query, data);
    return {
      page: getEndpointPageFromInput(data),
      records: usageRecordListExtractor(records),
    };
  };

export default getWorkspaceSummedUsage;
