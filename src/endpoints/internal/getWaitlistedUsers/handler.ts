import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIkxUtils} from '../../../contexts/ijx/injectables.js';
import {userListExtractor} from '../../users/utils.js';
import {assertUserIsPartOfRootWorkspace} from '../utils.js';
import {GetWaitlistedUsersEndpoint} from './types.js';

const getWaitlistedUsers: GetWaitlistedUsersEndpoint = async reqData => {
  const agent = await kIkxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kIjxSemantic.user().getManyByQuery({isOnWaitlist: true});
  return {users: userListExtractor(users)};
};

export default getWaitlistedUsers;
