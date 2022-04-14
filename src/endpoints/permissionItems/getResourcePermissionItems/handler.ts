import {first, flattenDeep, uniqBy} from 'lodash';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {BasicCRUDActions, AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  getFilePermissionOwners,
  IPermissionOwner,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {IResource} from '../../resources/types';
import checkPermissionOwnersExist from '../checkPermissionOwnersExist';
import checkResourcesExist from '../checkResourcesExist';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsJoiSchema} from './validation';
import {getWorkspaceId} from '../../contexts/SessionContext';

const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getResourcePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.Read,
    type: AppResourceType.PermissionItem,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
  });

  const {resources} = await checkResourcesExist(context, agent, workspace, [
    data,
  ]);

  let permissionOwner: IResource | undefined = undefined;
  const resource: IResource | undefined = first(resources);

  if (data.permissionOwnerId && data.permissionOwnerType) {
    const result = await checkPermissionOwnersExist(context, agent, workspace, [
      {
        permissionOwnerId: data.permissionOwnerId,
        permissionOwnerType: data.permissionOwnerType,
      },
    ]);

    permissionOwner = first(result.resources);
  }

  let permissionOwners: IPermissionOwner[] = [];

  if (
    resource &&
    (resource.resourceType === AppResourceType.File ||
      resource.resourceType === AppResourceType.Folder)
  ) {
    permissionOwners = getFilePermissionOwners(
      workspace.resourceId,
      resource.resource as any,
      resource.resourceType
    );
  } else if (
    permissionOwner &&
    (permissionOwner.resourceType === AppResourceType.File ||
      permissionOwner.resourceType === AppResourceType.Folder)
  ) {
    permissionOwners = getFilePermissionOwners(
      workspace.resourceId,
      permissionOwner.resource as any,
      permissionOwner.resourceType
    );
  } else {
    permissionOwners = makeWorkspacePermissionOwnerList(workspace.resourceId);
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

      if (item.appliesTo === PermissionItemAppliesTo.Owner) {
        return item.permissionOwnerId === data.itemResourceId;
      } else if (item.appliesTo === PermissionItemAppliesTo.Children) {
        return item.permissionOwnerId !== data.itemResourceId;
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
