import {AppResourceType} from '../../../definitions/system';
import {userListExtractor} from '../../users/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetWaitlistedUsersEndpoint} from './types';

const getWaitlistedUsers: GetWaitlistedUsersEndpoint = async (context, instData) => {
  const agent = await context.session.getAgent(context, instData, [AppResourceType.User]);
  await assertUserIsPartOfRootWorkspace(context, agent);
  const users = await context.semantic.user.getManyByQuery({isOnWaitlist: true});
  return {users: userListExtractor(users as any)};
};

export default getWaitlistedUsers;
