import {User} from '../../definitions/user';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {BaseContext} from '../contexts/types';
import {collaboratorExtractor, removeOtherUserWorkspaces} from './utils';

export async function extractCollaborator(
  context: BaseContext,
  collaborator: User,
  workspaceId: string
) {
  const userWithWorkspaces = await populateUserWorkspaces(context, collaborator);
  return collaboratorExtractor(
    removeOtherUserWorkspaces(userWithWorkspaces, workspaceId),
    workspaceId
  );
}
