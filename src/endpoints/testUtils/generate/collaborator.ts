import {Agent} from '../../../definitions/system';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertUserListForTest} from './user';

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
