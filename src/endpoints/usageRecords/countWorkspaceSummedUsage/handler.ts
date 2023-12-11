import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {getWorkspaceSummedUsageQuery} from '../getWorkspaceSummedUsage/utils';
import {CountWorkspaceSummedUsageEndpoint} from './types';
import {countWorkspaceSummedUsageJoiSchema} from './validation';

const countWorkspaceSummedUsage: CountWorkspaceSummedUsageEndpoint = async instData => {
  const data = validate(instData.data, countWorkspaceSummedUsageJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {query} = await getWorkspaceSummedUsageQuery(agent, workspaceId, data);
  const count = await kSemanticModels.usageRecord().countByQuery(query);
  return {count};
};

export default countWorkspaceSummedUsage;
