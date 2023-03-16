import {compact, uniq} from 'lodash';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {newWorkspaceResource, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../utils/resourceId';
import {
  sortOutPermissionItems,
  uniquePermissionItems,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {
  checkPermissionContainersExist,
  checkPermissionEntitiesExist,
  checkPermissionTargetsExist,
} from '../checkPermissionArtifacts';
import {IAddPermissionItemsEndpointParams} from './types';

export const internalAddPermissionItems = async (
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  data: IAddPermissionItemsEndpointParams
) => {
  const entityIdList = toArray(data.entityId),
    containerId = data.containerId ?? workspaceId;

  // TODO: check that targets belong to containers
  // TODO: max items sent in

  const [{resources: targets}] = await Promise.all([
    checkPermissionTargetsExist(
      context,
      agent,
      workspaceId,
      uniq(compact(data.items.map(item => item.targetId))),
      BasicCRUDActions.Read,
      containerId
    ),
    checkPermissionEntitiesExist(context, agent, workspaceId, entityIdList, BasicCRUDActions.Read),
    containerId !== workspaceId &&
      checkPermissionContainersExist(
        context,
        agent,
        workspaceId,
        [containerId],
        BasicCRUDActions.Read
      ),
  ]);

  const targetsMap = indexArray(targets, {path: 'resourceId'});
  let inputItems: IPermissionItem[] = [];
  data.items.forEach(input => {
    let targetType = input.targetType;
    if (!targetType) {
      appAssert(
        input.targetId,
        new InvalidRequestError('Target type or target ID must be provided.')
      );
      targetType = getResourceTypeFromId(input.targetId);
    }

    if (input.targetId && !targetsMap[input.targetId]) {
      // Skip input, target not found.
      return;
    }

    const item: IPermissionItem = newWorkspaceResource(
      agent,
      AppResourceType.PermissionItem,
      workspaceId,
      {
        ...input,
        containerId,
        targetType,
        entityId: data.entityId,
        grantAccess: input.grantAccess ?? true,
        containerType: getResourceTypeFromId(containerId),
        entityType: getResourceTypeFromId(data.entityId),
      }
    );
    inputItems.push(item);
  });

  let existingPermissionItems = await context.semantic.permissions.getEntitiesPermissionItems({
    context,
    containerId,
    entityId: entityIdList,
    sortByDate: true,
  });
  ({items: existingPermissionItems} = sortOutPermissionItems(existingPermissionItems));
  ({items: existingPermissionItems} = uniquePermissionItems(
    existingPermissionItems.concat(inputItems)
  ));
  const itemsMap = indexArray(existingPermissionItems, {path: 'resourceId'});
  inputItems = inputItems.filter(item => !!itemsMap[item.resourceId]);
  await context.semantic.permissionItem.insertList(inputItems);
  return inputItems;
};
