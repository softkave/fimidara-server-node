import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {userListExtractor} from '../../users/utils.js';
import {assertUserIsPartOfRootWorkspace} from '../utils.js';
import {GetWaitlistedUsersEndpoint} from './types.js';

const getWaitlistedUsers: GetWaitlistedUsersEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.user().getManyByQuery({isOnWaitlist: true});
  return {users: userListExtractor(users)};
};

export default getWaitlistedUsers;
