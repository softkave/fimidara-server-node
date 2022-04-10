import {IBaseContext} from '../contexts/BaseContext';
import {OrganizationExistsError} from './errors';
import OrganizationQueries from './queries';

export async function checkOrgNameExists(context: IBaseContext, name: string) {
  const organizationExists = await context.data.organization.checkItemExists(
    OrganizationQueries.getByName(name)
  );

  if (organizationExists) {
    throw new OrganizationExistsError();
  }
}
