import {User} from '../../definitions/user';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {collaboratorExtractor, removeOtherUserWorkspaces} from './utils';

export async function extractCollaborator(collaborator: User, workspaceId: string) {
  const userWithWorkspaces = await populateUserWorkspaces(collaborator);
  return collaboratorExtractor(
    removeOtherUserWorkspaces(userWithWorkspaces, workspaceId),
    workspaceId
  );
}
