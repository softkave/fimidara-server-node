import {IBaseContext} from '../contexts/BaseContext';
import {ResourceExistsError} from '../errors';
import PresetPermissionsGroupQueries from './queries';

export async function checkPresetNameExists(
  context: IBaseContext,
  orgId: string,
  name: string
) {
  const itemExists = await context.data.preset.checkItemExists(
    PresetPermissionsGroupQueries.getByOrganizationAndName(orgId, name)
  );

  if (itemExists) {
    throw new ResourceExistsError('Permission group exists');
  }
}
