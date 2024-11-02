import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {UserExistsEndpoint} from './types.js';
import {userExistsJoiSchema} from './validation.js';

const userExistsEndpoint: UserExistsEndpoint = async reqData => {
  const data = validate(reqData.data, userExistsJoiSchema);
  const {workspace} = await initEndpoint(reqData);

  // TODO: should we add a checkUserExists permission action?

  const exists = await kSemanticModels.user().existsByEmail({
    email: data.email,
    workspaceId: workspace.resourceId,
  });

  return {exists};
};

export default userExistsEndpoint;
