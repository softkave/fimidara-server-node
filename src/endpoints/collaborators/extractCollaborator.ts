import {IUser} from '../../definitions/user';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {IBaseContext} from '../contexts/types';
import {collaboratorExtractor, removeOtherUserWorkspaces} from './utils';

export async function extractCollaborator(
  context: IBaseContext,
  collaborator: IUser,
  workspaceId: string
) {
  const userWithWorkspaces = await populateUserWorkspaces(
    context,
    collaborator
  );
  return collaboratorExtractor(
    removeOtherUserWorkspaces(userWithWorkspaces, workspaceId),
    workspaceId
  );
}
