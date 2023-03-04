import {IBaseContext} from '../contexts/types';
import {ResourceExistsError} from '../errors';

export async function checkTagNameExists(context: IBaseContext, workspaceId: string, name: string) {
  const itemExists = await context.semantic.tag.existsByName(workspaceId, name);
  if (itemExists) {
    throw new ResourceExistsError('Tag exists');
  }
}
