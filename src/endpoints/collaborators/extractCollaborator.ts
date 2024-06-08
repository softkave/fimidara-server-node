import {User} from '../../definitions/user.js';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems.js';
import {collaboratorExtractor, removeOtherUserWorkspaces} from './utils.js';

export async function extractCollaborator(collaborator: User, workspaceId: string) {
  const userWithWorkspaces = await populateUserWorkspaces(collaborator);
  return collaboratorExtractor(
    removeOtherUserWorkspaces(userWithWorkspaces, workspaceId),
    workspaceId
  );
}
