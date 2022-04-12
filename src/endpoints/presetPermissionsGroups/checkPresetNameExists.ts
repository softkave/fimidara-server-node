import {IBaseContext} from '../contexts/BaseContext';
import {ResourceExistsError} from '../errors';
import PresetPermissionsGroupQueries from './queries';

export async function checkPresetNameExists(
  context: IBaseContext,
  workspaceId: string,
  name: string
) {
  const itemExists = await context.data.preset.checkItemExists(
    PresetPermissionsGroupQueries.getByWorkspaceAndName(workspaceId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }
}
