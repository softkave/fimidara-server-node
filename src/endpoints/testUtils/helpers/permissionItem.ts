import {AppActionType, AppResourceType} from '../../../definitions/system';
import {makeKey, toNonNullableArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {BaseContextType} from '../../contexts/types';

export async function expectEntityHavePermissionsTargetingId(
  context: BaseContextType,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetId: string | string[],
  access: boolean
) {
  // TODO: maybe use checkAuthorization's access check mechanisms because this
  // implementation is not factoring in appliesTo

  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByQuery({
    entityId: {$in: toNonNullableArray(entityId)},
    action: {$in: toNonNullableArray(action) as any[]},
    targetId: {$in: toNonNullableArray(targetId)},
  });

  // Index permission items by action - target ID - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.entityId, item.action, item.targetId]),
  });

  // Make checks using key structure defined above, expecting to match expected
  // result.
  toNonNullableArray(targetId).forEach(nextTargetId => {
    toNonNullableArray(entityId).forEach(nextEntityId => {
      toNonNullableArray(action).forEach(nextAction => {
        const key = makeKey([nextEntityId, nextAction, nextTargetId]);
        expect(map[key].grantAccess).toBe(access);
      });
    });
  });
}

export async function expectEntityHasPermissionsTargetingType(
  context: BaseContextType,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetId: string,
  targetType: AppResourceType | AppResourceType[],
  result: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByQuery({
    entityId: {$in: toNonNullableArray(entityId)},
    action: {$in: toNonNullableArray(action) as any[]},
    targetType: {$in: toNonNullableArray(targetType) as any[]},
    targetId: {$in: toNonNullableArray(targetId)},
  });

  // Index permission items by action - target type - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.action, item.targetType, item.entityId]),
  });

  // Make checks using key structure defined above, expecting to match expected
  // result.
  toNonNullableArray(targetType).forEach(nextTargetType => {
    toNonNullableArray(entityId).forEach(nextEntityId => {
      toNonNullableArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetType, nextEntityId]);
        expect(!!map[key]).toBe(result);
      });
    });
  });
}
