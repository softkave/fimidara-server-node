import {PermissionAction, PermissionItem} from '../../../definitions/permissionItem';
import {FimidaraResourceType} from '../../../definitions/system';
import {convertToArray, makeKey} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {getInAndNinQuery} from '../../contexts/semantic/utils';

export async function expectEntityHasPermissionsTargetingId(
  entityId: string | string[],
  action: PermissionAction | PermissionAction[],
  targetId: string | string[],
  access: boolean
) {
  // TODO: maybe use checkAuthorization's access check mechanisms because this
  // implementation is not factoring in appliesTo

  // fetch permission items
  const items = await kSemanticModels.permissionItem().getManyByQuery({
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
  convertToArray(targetId).forEach(nextTargetId => {
    convertToArray(entityId).forEach(nextEntityId => {
      convertToArray(action).forEach(nextAction => {
        const key = makeKey([nextEntityId, nextAction, nextTargetId]);
        expect(map[key].access).toBe(access);
      });
    });
  });
}

export async function expectEntityHasPermissionsTargetingType(
  entityId: string | string[],
  action: PermissionAction | PermissionAction[],
  targetId: string,
  targetType: FimidaraResourceType | FimidaraResourceType[],
  result: boolean
) {
  // fetch permission items
  const items = await kSemanticModels.permissionItem().getManyByQuery({
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
  convertToArray(targetType).forEach(nextTargetType => {
    convertToArray(entityId).forEach(nextEntityId => {
      convertToArray(action).forEach(nextAction => {
        const key = makeKey([nextAction, nextTargetType, nextEntityId]);
        expect(!!map[key]).toBe(result);
      });
    });
  });
}
