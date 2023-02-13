import {first, flattenDeep, uniqBy} from 'lodash';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  checkAuthorization,
  getFilePermissionContainers,
  IPermissionContainer,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {IResource} from '../../resources/types';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import checkPermissionContainersExist from '../checkPermissionContainersExist';
import checkPermissionTargetsExist from '../checkResourcesExist';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsJoiSchema} from './validation';

const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async (context, instData) => {
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
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  const {resources} = await checkPermissionTargetsExist(context, agent, workspace, [data]);
  let permissionContainer: IResource | undefined = undefined;
  const resource: IResource | undefined = first(resources);
  if (data.containerId && data.containerType) {
    const result = await checkPermissionContainersExist(context, agent, workspace, [
      {containerId: data.containerId, containerType: data.containerType},
    ]);
    permissionContainer = first(result.resources);
  }

  let permissionContainers: IPermissionContainer[] = [];
  if (
    resource &&
    (resource.resourceType === AppResourceType.File || resource.resourceType === AppResourceType.Folder)
  ) {
    permissionContainers = getFilePermissionContainers(
      workspace.resourceId,
      resource.resource as any,
      resource.resourceType
    );
  } else if (
    permissionContainer &&
    (permissionContainer.resourceType === AppResourceType.File ||
      permissionContainer.resourceType === AppResourceType.Folder)
  ) {
    permissionContainers = getFilePermissionContainers(
      workspace.resourceId,
      permissionContainer.resource as any,
      permissionContainer.resourceType
    );
  } else {
    permissionContainers = makeWorkspacePermissionContainerList(workspace.resourceId);
  }

  const items2DList = await Promise.all(
    permissionContainers.map(item =>
      context.data.permissionItem.getManyByQuery(
        PermissionItemQueries.getByContainerAndResource(
          item.containerId,
          item.containerType,
          data.targetType,
          undefined,
          true
        ),
        data
      )
    )
  );

  let items = uniqBy(flattenDeep(items2DList), 'hash');
  items = items.filter(item => {
    if (data.targetId) {
      if (item.targetId && item.targetId !== data.targetId) {
        return false;
      }
      if (item.appliesTo === PermissionItemAppliesTo.Container) {
        return item.containerId === data.targetId;
      } else if (item.appliesTo === PermissionItemAppliesTo.Children) {
        return item.containerId !== data.targetId;
      }

      return true;
    } else {
      // Remove item if it has a target ID (i.e for a target) and query is for
      // target type and not a specific target
      return !item.targetId;
    }
  });

  return {page: getEndpointPageFromInput(data), items: PermissionItemUtils.extractPublicPermissionItemList(items)};
};

export default getResourcePermissionItems;
