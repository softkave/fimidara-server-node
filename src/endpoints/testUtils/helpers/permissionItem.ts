import {PermissionAction, PermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {makeKey, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getInAndNinQuery} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';

export async function expectEntityHasPermissionsTargetingId(
  context: BaseContextType,
  entityId: string | string[],
  action: PermissionAction | PermissionAction[],
  targetId: string | string[],
  access: boolean
) {
  // TODO: maybe use checkAuthorization's access check mechanisms because this
  // implementation is not factoring in appliesTo

  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByQuery({
    ...getInAndNinQuery<PermissionItem>('entityId', entityId),
    ...getInAndNinQuery<PermissionItem>('action', action),
    ...getInAndNinQuery<PermissionItem>('targetId', targetId),
  });

  // Index permission items by action - target ID - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.entityId, item.action, item.targetId]),
  });

  // Make checks using key structure defined above, expecting to match expected
  // result.
  toArray(targetId).forEach(nextTargetId => {
    toArray(entityId).forEach(nextEntityId => {
      toArray(action).forEach(nextAction => {
        const key = makeKey([nextEntityId, nextAction, nextTargetId]);
        expect(map[key].access).toBe(access);
      });
    });
  });
}

export async function expectEntityHasPermissionsTargetingType(
  context: BaseContextType,
  entityId: string | string[],
  action: PermissionAction | PermissionAction[],
  targetId: string,
  targetType: AppResourceType | AppResourceType[],
  result: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByQuery({
    ...getInAndNinQuery<PermissionItem>('entityId', entityId),
    ...getInAndNinQuery<PermissionItem>('action', action),
    ...getInAndNinQuery<PermissionItem>('targetType', targetType),
    ...getInAndNinQuery<PermissionItem>('targetId', targetId),
  });

  // Index permission items by action - target type - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.action, item.targetType, item.entityId]),
  });

  // Make checks using key structure defined above, expecting to match expected
  // result.
  toArray(targetType).forEach(nextTargetType => {
    toArray(entityId).forEach(nextEntityId => {
      toArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetType, nextEntityId]);
        expect(!!map[key]).toBe(result);
      });
    });
  });
}
