import {first, flattenDeep, uniqBy} from 'lodash';
import {BasicCRUDActions, AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  getFilePermissionOwners,
  IPermissionOwner,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import {IResource} from '../../resources/types';
import checkPermissionOwnersExist from '../checkPermissionOwnersExist';
import checkResourcesExist from '../checkResourcesExist';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsJoiSchema} from './validation';

const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getResourcePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkAuthorization({
    context,
    agent,
    organization,
    action: BasicCRUDActions.Read,
    type: AppResourceType.PermissionItem,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
  });

  const {resources} = await checkResourcesExist(context, agent, organization, [
    data,
  ]);

  let permissionOwner: IResource | undefined = undefined;
  const resource: IResource | undefined = first(resources);

  if (data.permissionOwnerId && data.permissionOwnerType) {
    const result = await checkPermissionOwnersExist(
      context,
      agent,
      organization,
      [
        {
          permissionOwnerId: data.permissionOwnerId,
          permissionOwnerType: data.permissionOwnerType,
        },
      ]
    );

    permissionOwner = first(result.resources);
  }

  let permissionOwners: IPermissionOwner[] = [];

  if (
    resource &&
    (resource.resourceType === AppResourceType.File ||
      resource.resourceType === AppResourceType.Folder)
  ) {
    permissionOwners = getFilePermissionOwners(
      organization.resourceId,
      resource.resource as any,
      resource.resourceType
    );
  } else if (
    permissionOwner &&
    (permissionOwner.resourceType === AppResourceType.File ||
      permissionOwner.resourceType === AppResourceType.Folder)
  ) {
    permissionOwners = getFilePermissionOwners(
      organization.resourceId,
      permissionOwner.resource as any,
      permissionOwner.resourceType
    );
  } else {
    permissionOwners = makeOrgPermissionOwnerList(organization.resourceId);
  }

  const items2DList = await Promise.all(
    permissionOwners.map(item =>
      context.data.permissionItem.getManyItems(
        PermissionItemQueries.getByOwnerAndResource(
          item.permissionOwnerId,
          item.permissionOwnerType,
          data.itemResourceType,
          undefined, // data.itemResourceId,
          true
        )
      )
    )
  );

  let items = uniqBy(flattenDeep(items2DList), 'hash');
  items = items.filter(item => {
    if (data.itemResourceId) {
      if (item.itemResourceId && item.itemResourceId !== data.itemResourceId) {
        return false;
      }

      if (item.permissionOwnerId === data.itemResourceId) {
        if (item.isForPermissionOwnerChildren) {
          return false;
        }
      } else {
        if (item.isForPermissionOwner) {
          return false;
        }
      }

      return true;
    } else {
      return !item.itemResourceId;
    }
  });

  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default getResourcePermissionItems;
