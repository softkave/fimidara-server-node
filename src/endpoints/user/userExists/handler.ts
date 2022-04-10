import {validate} from '../../../utilities/validate';
import UserQueries from '../UserQueries';
import {UserExistsEndpoint} from './types';
import {userExistsJoiSchema} from './validation';

const userExists: UserExistsEndpoint = async (context, instData) => {
  const data = validate(instData.data, userExistsJoiSchema);
  const exists = await context.data.user.checkItemExists(
    UserQueries.getByEmail(data.email)
  );
  return {exists};
};

export default userExists;
