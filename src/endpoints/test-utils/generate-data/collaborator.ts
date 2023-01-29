import {IAgent} from '../../../definitions/system';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {generateUserForTest} from './user';

export async function generateAndInsertCollaboratorForTest(ctx: IBaseContext, agent: IAgent, workspaceId: string) {
  const user = generateUserForTest();
  await assignWorkspaceToUser(ctx, agent, workspaceId, user);
  return user;
}

export async function generateAndInsertCollaboratorListForTest(
  ctx: IBaseContext,
  agent: IAgent,
  workspaceId: string,
  count = 20
) {
  const items: Promise<any>[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateAndInsertCollaboratorForTest(ctx, agent, workspaceId));
  }
  return await Promise.all(items);
}
