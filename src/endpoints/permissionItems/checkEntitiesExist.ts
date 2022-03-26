import {format} from 'util';
import {IOrganization} from '../../definitions/organization';
import {ISessionAgent, AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import {getResources} from '../resources/getResources';
import {checkNotOrganizationResources} from '../resources/isPartOfOrganization';

/**
 * Entity auth check is enough for permission items cause
 * permission items are basically extensions of the entites
 * and are considered to belong to the entities.
 */

const allowedTypes = new Map();
allowedTypes.set(AppResourceType.ClientAssignedToken, true);
allowedTypes.set(AppResourceType.ProgramAccessToken, true);
allowedTypes.set(AppResourceType.PresetPermissionsGroup, true);
allowedTypes.set(AppResourceType.User, true);

export default async function checkEntitiesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  entities: Array<{
    permissionEntityId: string;
    permissionEntityType: AppResourceType;
  }>
) {
  entities.forEach(item => {
    if (!allowedTypes.has(item.permissionEntityType)) {
      const message = format(
        'Invalid permission entity type %s',
        item.permissionEntityType
      );

      throw new InvalidRequestError(message);
    }
  });

  const resources = await getResources({
    context,
    agent,
    organization,
    inputResources: entities.map(item => ({
      resourceId: item.permissionEntityId,
      resourceType: item.permissionEntityType,
    })),
    checkAuth: true,
  });

  checkNotOrganizationResources(organization.resourceId, resources);
}
