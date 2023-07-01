import {AppResourceType} from '../../../definitions/system';
import {userListExtractor} from '../../users/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetUsersEndpoint} from './types';

const getUsers: GetUsersEndpoint = async (context, instData) => {
  const agent = await context.session.getAgent(context, instData, [AppResourceType.User]);
  await assertUserIsPartOfRootWorkspace(context, agent);
  const users = await context.semantic.user.getManyByQuery({});
  return {users: userListExtractor(users as any)};
};

export default getUsers;
