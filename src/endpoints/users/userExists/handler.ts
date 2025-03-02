import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {UserExistsEndpoint} from './types.js';
import {userExistsJoiSchema} from './validation.js';

const userExists: UserExistsEndpoint = async reqData => {
  const data = validate(reqData.data, userExistsJoiSchema);
  const exists = await kIjxSemantic.user().existsByEmail(data.email);
  return {exists};
};

export default userExists;
