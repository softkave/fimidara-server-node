import {validate} from '../../../utils/validate.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {UserExistsEndpoint} from './types.js';
import {userExistsJoiSchema} from './validation.js';

const userExists: UserExistsEndpoint = async instData => {
  const data = validate(instData.data, userExistsJoiSchema);
  const exists = await kSemanticModels.user().existsByEmail(data.email);
  return {exists};
};

export default userExists;
