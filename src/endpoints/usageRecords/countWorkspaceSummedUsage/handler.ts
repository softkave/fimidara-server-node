import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceSummedUsageQuery} from '../getWorkspaceSummedUsage/utils.js';
import {CountWorkspaceSummedUsageEndpoint} from './types.js';
import {countWorkspaceSummedUsageJoiSchema} from './validation.js';

const countWorkspaceSummedUsage: CountWorkspaceSummedUsageEndpoint =
  async reqData => {
    const data = validate(reqData.data, countWorkspaceSummedUsageJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
    const {query} = await getWorkspaceSummedUsageQuery(
      agent,
      workspaceId,
      data
    );
    const count = await kIjxSemantic.usageRecord().countByQuery(query);
    return {count};
  };

export default countWorkspaceSummedUsage;
