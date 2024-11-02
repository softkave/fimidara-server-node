import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {userListExtractor} from '../../users/utils.js';
import {assertUserIsPartOfRootWorkspace} from '../utils.js';
import {GetUsersEndpoint} from './types.js';

const getUsers: GetUsersEndpoint = async reqData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.user,
      kSessionUtils.accessScope.user
    );
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.user().getManyByQuery({});

  return {users: userListExtractor(users)};
};

export default getUsers;
