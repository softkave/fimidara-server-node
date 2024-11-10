import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {usageRecordListExtractor} from '../utils.js';
import {GetSummedUsageEndpoint} from './types.js';
import {getSummedUsageQuery} from './utils.js';
import {getSummedUsageJoiSchema} from './validation.js';

const getSummedUsage: GetSummedUsageEndpoint = async reqData => {
  const data = validate(reqData.data, getSummedUsageJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  applyDefaultEndpointPaginationOptions(data);
  const {query} = await getSummedUsageQuery(agent, workspaceId, data);
  const records = await kSemanticModels
    .usageRecord()
    .getManyByQuery(query, data);

  return {
    page: getEndpointPageFromInput(data),
    records: usageRecordListExtractor(records),
  };
};

export default getSummedUsage;
