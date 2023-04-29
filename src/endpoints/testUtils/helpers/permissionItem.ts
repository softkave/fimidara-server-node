import {AppActionType, AppResourceType} from '../../../definitions/system';
import {makeKey, toNonNullableArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {BaseContextType} from '../../contexts/types';

export async function canEntityPerformActionOnTargetId(
  context: BaseContextType,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetId: string | string[],
  result: boolean
) {
  // TODO: maybe use checkAuthorization's access check mechanisms because this
  // implementation is not factoring in appliesTo

  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
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
        expect(map[key].grantAccess).toBe(result);
      });
    });
  });
}

export async function canEntityPerformActionOnTargetType(
  context: BaseContextType,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetType: AppResourceType | AppResourceType[],
  result: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
    entityId: {$in: toNonNullableArray(entityId)},
    action: {$in: toNonNullableArray(action) as any[]},
    targetType: {$in: toNonNullableArray(targetType) as any[]},
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

export async function checkExplicitAccessPermissionsOnTargetId(
  context: BaseContextType,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetId: string | string[],
  grantAccess: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
    grantAccess,
    entityId: {$in: toNonNullableArray(entityId)},
    action: {$in: toNonNullableArray(action) as any[]},
    targetId: {$in: toNonNullableArray(targetId) as any[]},
  });

  // Index permission items by action - target ID - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.action, item.targetId, item.entityId]),
  });

  // Make checks using key structure defined above, expecting each entry to
  // exist, to be truthy.
  toNonNullableArray(targetId).forEach(nextTargetId => {
    toNonNullableArray(entityId).forEach(nextEntityId => {
      toNonNullableArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetId, nextEntityId]);
        expect(!!map[key]).toBeTruthy();
      });
    });
  });
}

export async function checkExplicitAccessPermissionsOnTargetType(
  context: BaseContextType,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetType: AppResourceType | AppResourceType[],
  grantAccess: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
    grantAccess,
    entityId: {$in: toNonNullableArray(entityId)},
    action: {$in: toNonNullableArray(action) as any[]},
    targetType: {$in: toNonNullableArray(targetType) as any[]},
  });

  // Index permission items by action - target type - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.action, item.targetType, item.entityId]),
  });

  // Make checks using key structure defined above, expecting each entry to
  // exist, to be truthy.
  toNonNullableArray(targetType).forEach(nextTargetType => {
    toNonNullableArray(entityId).forEach(nextEntityId => {
      toNonNullableArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetType, nextEntityId]);
        expect(!!map[key]).toBeTruthy();
      });
    });
  });
}
