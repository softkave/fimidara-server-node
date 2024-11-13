import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {userExtractor} from '../utils.js';
import {getUserForEndpoint} from '../utils/getUserFromSessionAgent.js';
import {GetUserEndpoint} from './types.js';
import {getUserJoiSchema} from './validation.js';

const getUserEndpoint: GetUserEndpoint = async reqData => {
  const data = validate(reqData.data, getUserJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData);
  const user = await kSemanticModels.utils().withTxn(async opts => {
    return getUserForEndpoint(
      agent,
      /** params */ {workspaceId, userId: data.userId},
      opts
    );
  });

  return {user: userExtractor(user)};
};

export default getUserEndpoint;
