import {IUser} from '../../definitions/user';
import {withUserWorkspaces} from '../assignedItems/getAssignedItems';
import {IBaseContext} from '../contexts/BaseContext';
import {collaboratorExtractor, removeOtherUserWorkspaces} from './utils';

export async function extractCollaborator(
  context: IBaseContext,
  collaborator: IUser,
  workspaceId: string
) {
  const userWithWorkspaces = await withUserWorkspaces(context, collaborator);
  return collaboratorExtractor(
    removeOtherUserWorkspaces(userWithWorkspaces, workspaceId),
    workspaceId
  );
}
