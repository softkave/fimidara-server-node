import {validate} from '../../../utils/validate';
import {UserExistsEndpoint} from './types';
import {userExistsJoiSchema} from './validation';

const userExists: UserExistsEndpoint = async (context, instData) => {
  const data = validate(instData.data, userExistsJoiSchema);
  const exists = await context.semantic.user.existsByEmail(data.email);
  return {exists};
};

export default userExists;
