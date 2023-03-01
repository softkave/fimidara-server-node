import {compact, first, uniq} from 'lodash';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {newResource, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../utils/resourceId';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {
  checkAuthorization,
  uniquePermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {InvalidRequestError} from '../../errors';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {
  checkPermissionContainersExist,
  checkPermissionEntitiesExist,
  checkPermissionTargetsExist,
} from '../checkPermissionArtifacts';
import {PermissionItemUtils} from '../utils';
import {AddPermissionItemsEndpoint} from './types';
import {addPermissionItemsJoiSchema} from './validation';

const addPermissionItems: AddPermissionItemsEndpoint = async (context, instData) => {
  const data = validate(instData.data, addPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = await getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: BasicCRUDActions.Create,
    targets: [{type: AppResourceType.PermissionItem}],
  });

  const entityIdList = toArray(data.entityId),
    containerId = data.containerId ?? workspace.resourceId;

  // TODO: check that targets belong to containers
  // TODO: max items sent in

  const [{resources: targets}] = await Promise.all([
    checkPermissionTargetsExist(
      context,
      agent,
      workspaceId,
      uniq(compact(data.items.map(item => item.targetId))),
      containerId
    ),
    checkPermissionEntitiesExist(context, agent, workspaceId, entityIdList),
    containerId !== workspaceId &&
      checkPermissionContainersExist(context, agent, workspaceId, [containerId]),
  ]);

  const targetsMap = indexArray(targets, {path: 'resourceId'});
  let inputItems: IPermissionItem[] = [];
  entityIdList.forEach(entityId => {
    data.items.map(input => {
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

      const item: IPermissionItem = newResource(agent, AppResourceType.PermissionItem, {
        ...input,
        containerId,
        entityId,
        workspaceId,
        targetType,
        grantAccess: input.grantAccess ?? true,
        appliesTo: input.appliesTo ?? PermissionItemAppliesTo.Children,
        containerType: getResourceTypeFromId(containerId),
        entityType: getResourceTypeFromId(entityId),
      });
      inputItems.push(item);
    });
  });

  const pItemsList = await context.semantic.permissions.getPermissionItemsForEntities({
    context,
    entities: entityIdList,
    sortByDate: true,
    andQueries: [{containerId}],
  });
  let permissionItems = first(pItemsList);
  appAssert(permissionItems);
  permissionItems = uniquePermissionItems(permissionItems.concat(inputItems));
  const itemsMap = indexArray(permissionItems, {path: 'resourceId'});
  inputItems = inputItems.filter(item => !!itemsMap[item.resourceId]);
  await context.semantic.permissionItem.insertList(inputItems);
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(inputItems),
  };
};

export default addPermissionItems;
