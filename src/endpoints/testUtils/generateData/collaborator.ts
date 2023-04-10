import {IAgent} from '../../../definitions/system';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';
import {generateAndInsertUserListForTest} from './user';

export async function generateAndInsertCollaboratorListForTest(
  ctx: IBaseContext,
  agent: IAgent,
  workspaceId: string,
  count = 20
) {
  const users = await generateAndInsertUserListForTest(ctx, count);
  await executeWithMutationRunOptions(ctx, opts =>
    Promise.all(
      users.map(user => assignWorkspaceToUser(ctx, agent, workspaceId, user.resourceId, opts))
    )
  );
  return users;
}
