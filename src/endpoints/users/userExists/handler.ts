import {validate} from '../../../utils/validate';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {UserExistsEndpoint} from './types';
import {userExistsJoiSchema} from './validation';

const userExists: UserExistsEndpoint = async instData => {
  const data = validate(instData.data, userExistsJoiSchema);
  const exists = await kSemanticModels.user().existsByEmail(data.email);
  return {exists};
};

export default userExists;
