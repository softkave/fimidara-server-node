import {Agent} from '../../../definitions/system.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertUserListForTest} from './user.js';

export async function generateAndInsertCollaboratorListForTest(
  agent: Agent,
  workspaceId: string,
  count = 20
) {
  const users = await generateAndInsertUserListForTest(count);
  await kSemanticModels
    .utils()
    .withTxn(
      opts =>
        Promise.all(
          users.map(user =>
            assignWorkspaceToUser(agent, workspaceId, user.resourceId, opts)
          )
        ),
      /** reuseTxn */ true
    );

  return users;
}
