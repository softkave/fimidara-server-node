import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {usageRecordListExtractor} from '../utils';
import {GetWorkspaceSummedUsageEndpoint} from './types';
import {getWorkspaceSummedUsageQuery} from './utils';
import {getWorkspaceSummedUsageJoiSchema} from './validation';

const getWorkspaceSummedUsage: GetWorkspaceSummedUsageEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceSummedUsageJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  applyDefaultEndpointPaginationOptions(data);
  const {query} = await getWorkspaceSummedUsageQuery(context, agent, workspaceId, data);
  const records = await context.semantic.usageRecord.getManyByQuery(query, data);
  return {page: getEndpointPageFromInput(data), records: usageRecordListExtractor(records)};
};

export default getWorkspaceSummedUsage;
