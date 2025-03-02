import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {Agent} from '../../../definitions/system.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {generateAndInsertUserListForTest} from './user.js';

export async function generateAndInsertCollaboratorListForTest(
  agent: Agent,
  workspaceId: string,
  count = 20
) {
  const users = await generateAndInsertUserListForTest(count);
  await kIjxSemantic
    .utils()
    .withTxn(opts =>
      Promise.all(
        users.map(user =>
          assignWorkspaceToUser(agent, workspaceId, user.resourceId, opts)
        )
      )
    );

  return users;
}
