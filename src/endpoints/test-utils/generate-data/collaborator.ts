import {IAgent} from '../../../definitions/system';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {generateAndInsertUserListForTest} from './user';

export async function generateAndInsertCollaboratorListForTest(
  ctx: IBaseContext,
  agent: IAgent,
  workspaceId: string,
  count = 20
) {
  const users = await generateAndInsertUserListForTest(ctx, count);
  await Promise.all(users.map(user => assignWorkspaceToUser(ctx, agent, workspaceId, user)));
  return users;
}
