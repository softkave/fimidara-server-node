import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getLoginResult} from '../login/utils.js';
import {getUserForEndpoint} from '../utils/getUserFromSessionAgent.js';
import {GetUserLoginEndpoint} from './types.js';
import {getUserLoginJoiSchema} from './validation.js';

const getUserLoginEndpoint: GetUserLoginEndpoint = async reqData => {
  const data = validate(reqData.data, getUserLoginJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData);
  const user = await kSemanticModels.utils().withTxn(async opts => {
    return await getUserForEndpoint(
      agent,
      /** params */ {workspaceId, userId: data.userId},
      opts
    );
  });

  return await getLoginResult(user);
};

export default getUserLoginEndpoint;
