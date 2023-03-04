import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {GetWorkspaceSummedUsageEndpoint} from './types';
import {getWorkspaceSummedUsageQuery} from './utils';
import {getWorkspaceSummedUsageJoiSchema} from './validation';

// TODO: should we include permissions check?
const getWorkspaceSummedUsage: GetWorkspaceSummedUsageEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceSummedUsageJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  applyDefaultEndpointPaginationOptions(data);
  const {query, sort} = await getWorkspaceSummedUsageQuery(context, agent, workspaceId, data);
  const records = await context.data.usageRecord.getManyByQuery(query, {
    ...data,
    sort,
  });
  return {page: getEndpointPageFromInput(data), records};
};

export default getWorkspaceSummedUsage;
