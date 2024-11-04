import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getSummedUsageQuery} from '../getSummedUsage/utils.js';
import {CountSummedUsageEndpoint} from './types.js';
import {countSummedUsageJoiSchema} from './validation.js';

const countSummedUsage: CountSummedUsageEndpoint = async reqData => {
  const data = validate(reqData.data, countSummedUsageJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {
    data,
    action: kFimidaraPermissionActions.readUsage,
  });

  const {query} = await getSummedUsageQuery(agent, workspaceId, data);
  const count = await kSemanticModels.usageRecord().countByQuery(query);

  return {count};
};

export default countSummedUsage;
