import {kAppResourceType} from '../../../definitions/system';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {userListExtractor} from '../../users/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetUsersEndpoint} from './types';

const getUsers: GetUsersEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, [kAppResourceType.User]);
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.user().getManyByQuery({});

  return {users: userListExtractor(users)};
};

export default getUsers;
