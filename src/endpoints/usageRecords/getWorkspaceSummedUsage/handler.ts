import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {usageRecordListExtractor} from '../utils';
import {GetWorkspaceSummedUsageEndpoint} from './types';
import {getWorkspaceSummedUsageQuery} from './utils';
import {getWorkspaceSummedUsageJoiSchema} from './validation';

const getWorkspaceSummedUsage: GetWorkspaceSummedUsageEndpoint = async instData => {
  const data = validate(instData.data, getWorkspaceSummedUsageJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
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
