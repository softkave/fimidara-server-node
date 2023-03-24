import {toArray} from 'lodash';
import {AppActionType, AppResourceType} from '../../../definitions/system';
import {makeKey} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {IBaseContext} from '../../contexts/types';

export async function canEntityPerformAction01(
  context: IBaseContext,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetId: string | string[],
  result: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
    entityId: {$in: toArray(entityId)},
    action: {$in: toArray(action) as any[]},
    targetId: {$in: toArray(targetId)},
  });

  // Index permission items by action - target ID - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.action, item.targetId, item.entityId]),
  });

  // Make checks using key structure defined above, expecting to match expected
  // result.
  toArray(targetId).forEach(nextTargetId => {
    toArray(entityId).forEach(nextEntityId => {
      toArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetId, nextEntityId]);
        expect(!!map[key]).toBe(result);
      });
    });
  });
}

export async function canEntityPerformAction02(
  context: IBaseContext,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetType: AppResourceType | AppResourceType[],
  result: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
    entityId: {$in: toArray(entityId)},
    action: {$in: toArray(action) as any[]},
    targetType: {$in: toArray(targetType) as any[]},
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

export async function checkExplicitAccessPermissions01(
  context: IBaseContext,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetId: string | string[],
  grantAccess: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
    grantAccess,
    entityId: {$in: toArray(entityId)},
    action: {$in: toArray(action) as any[]},
    targetId: {$in: toArray(targetId) as any[]},
  });

  // Index permission items by action - target ID - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.action, item.targetId, item.entityId]),
  });

  // Make checks using key structure defined above, expecting each entry to
  // exist, to be truthy.
  toArray(targetId).forEach(nextTargetId => {
    toArray(entityId).forEach(nextEntityId => {
      toArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetId, nextEntityId]);
        expect(!!map[key]).toBeTruthy();
      });
    });
  });
}

export async function checkExplicitAccessPermissions02(
  context: IBaseContext,
  entityId: string | string[],
  action: AppActionType | AppActionType[],
  targetType: AppResourceType | AppResourceType[],
  grantAccess: boolean
) {
  // fetch permission items
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery({
    grantAccess,
    entityId: {$in: toArray(entityId)},
    action: {$in: toArray(action) as any[]},
    targetType: {$in: toArray(targetType) as any[]},
  });

  // Index permission items by action - target type - entity ID. We're going to
  // use them for quick retrieval when checking.
  const map = indexArray(items, {
    indexer: item => makeKey([item.action, item.targetType, item.entityId]),
  });

  // Make checks using key structure defined above, expecting each entry to
  // exist, to be truthy.
  toArray(targetType).forEach(nextTargetType => {
    toArray(entityId).forEach(nextEntityId => {
      toArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetType, nextEntityId]);
        expect(!!map[key]).toBeTruthy();
      });
    });
  });
}
