import {validate} from '../../../utils/validate';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import {getWorkspaceSummedUsageQuery} from '../getWorkspaceSummedUsage/utils';
import {CountWorkspaceSummedUsageEndpoint} from './types';
import {countWorkspaceSummedUsageJoiSchema} from './validation';

const countWorkspaceSummedUsage: CountWorkspaceSummedUsageEndpoint = async (context, instData) => {
  const data = validate(instData.data, countWorkspaceSummedUsageJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {query} = await getWorkspaceSummedUsageQuery(context, agent, workspaceId, data);
  const count = await context.data.usageRecord.countByQuery(query);
  return {count};
};

export default countWorkspaceSummedUsage;
