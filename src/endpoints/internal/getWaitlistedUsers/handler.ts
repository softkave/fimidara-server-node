import {kAppResourceType} from '../../../definitions/system';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {userListExtractor} from '../../users/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetWaitlistedUsersEndpoint} from './types';

const getWaitlistedUsers: GetWaitlistedUsersEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, [kAppResourceType.User]);
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.user().getManyByQuery({isOnWaitlist: true});
  return {users: userListExtractor(users)};
};

export default getWaitlistedUsers;
