import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {userListExtractor} from '../../users/utils.js';
import {assertUserIsPartOfRootWorkspace} from '../utils.js';
import {GetUsersEndpoint} from './types.js';

const getUsers: GetUsersEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.user().getManyByQuery({});

  return {users: userListExtractor(users)};
};

export default getUsers;
