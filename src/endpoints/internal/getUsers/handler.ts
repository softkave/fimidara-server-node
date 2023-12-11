import {AppResourceTypeMap} from '../../../definitions/system';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {userListExtractor} from '../../users/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetUsersEndpoint} from './types';

const getUsers: GetUsersEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, [AppResourceTypeMap.User]);
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.user().getManyByQuery({});
  return {users: userListExtractor(users)};
};

export default getUsers;
