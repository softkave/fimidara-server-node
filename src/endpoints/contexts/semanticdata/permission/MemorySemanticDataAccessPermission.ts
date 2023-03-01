import {compact} from 'lodash';
import {
  IAssignedPermissionGroupMeta,
  PermissionEntityInheritanceMap,
} from '../../../../definitions/permissionGroups';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../../definitions/system';
import {appAssert} from '../../../../utils/assertion';
import {indexArray} from '../../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../../utils/resourceId';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {MemoryCacheIndexHelper} from '../../memorycache/MemoryCacheIndexHelper';
import {MemoryCacheIndexKeys} from '../../memorycache/MemoryCacheIndexKeys';
import {INDEX_PLACEHOLDER_VALUE} from '../../memorycache/utils';
import {IBaseContext} from '../../types';
import {ISemanticDataAccessPermissionProvider} from './types';

export class MemorySemanticDataAccessPermission implements ISemanticDataAccessPermissionProvider {
  async getEntityInheritanceMap(props: {
    context: IBaseContext;
    entityId: string;
    fetchDeep?: boolean;
  }) {
    const entity = this.getEntity(props);
    appAssert(entity, reuseableErrors.entity.notFound(props.entityId));

    const map: PermissionEntityInheritanceMap = {};
    const maxDepth = props.fetchDeep ? 100 : 1;
    let nextIdList = [props.entityId];
    const [assignedToItemIndex, assignedItemsMap] = await Promise.all([
      props.context.memory.assignedItem.getIndex(
        MemoryCacheIndexKeys.assignedItems.AssignedToItemId
      ),
      props.context.memory.assignedItem.getDataMap(),
    ]);

    for (let depth = 0; nextIdList.length && depth < maxDepth; depth++) {
      const nextIdMap: Record<string, number> = {};
      nextIdList.forEach(id => {
        const index = assignedToItemIndex.indexes[id];
        const idList = Object.keys(index);
        const assignedItems = compact(idList.map(id => assignedItemsMap[id])).map(item => {
          nextIdMap[item.assignedItemId] = INDEX_PLACEHOLDER_VALUE;
          map[item.assignedItemId] = {id, items: []};
          const meta: IAssignedPermissionGroupMeta = {
            assignedAt: item.createdAt,
            assignedBy: item.createdBy,
            permissionGroupId: item.assignedItemId,
            assignedToEntityId: item.assignedToItemId,
          };
          return meta;
        });
        map[id] = {id, items: assignedItems};
      });
      nextIdList = Object.keys(nextIdMap);
    }

    return map;
  }

  async getEntityAssignedPermissionGroups(props: {
    context: IBaseContext;
    entityId: string;
    fetchDeep?: boolean;
  }) {
    const map = await this.getEntityInheritanceMap(props);
    const {sortedItemsList} = props.context.logic.permissions.sortInheritanceMap({
      map,
      entityId: props.entityId,
    });
    const permissionGroupsMap = await props.context.memory.permissionGroup.getDataMap();
    const permissionGroups = sortedItemsList
      .filter(item => getResourceTypeFromId(item.id) === AppResourceType.PermissionGroup)
      .map(item => {
        return permissionGroupsMap[item.id];
      });
    return {permissionGroups, inheritanceMap: map};
  }

  async getPermissionItemsForEntities(props: {
    context: IBaseContext;
    entities: string[];
    andQueries?: Array<{
      action?: BasicCRUDActions[];
      targetId?: string[];
      targetIdIfPresent?: string[];
      targetType?: AppResourceType[];
      containerId?: string[];
      appliesTo?: PermissionItemAppliesTo[];
    }>;
    sortByDate?: boolean;
    sortByContainer?: boolean;
  }) {
    const permissionEntitiesIndex = await props.context.memory.permissionItem.getIndex(
      MemoryCacheIndexKeys.permissionItems.PermissionEntity
    );
    const pItemsList: IPermissionItem[][] = (props.andQueries ?? []).map(() => []);
    const targetIdMapList: Array<Record<string, string>> = [],
      actionMapList: Array<Record<string, string>> = [],
      targetIdIfPresentMapList: Array<Record<string, string>> = [],
      targetTypeMapList: Array<Record<string, string>> = [],
      containerIdMapList: Array<Record<string, number>> = [],
      appliesToMapList: Array<Record<string, string>> = [];

    props.andQueries?.forEach((q, i) => {
      if (q.targetId) targetIdMapList[i] = indexArray(q.targetId);
      if (q.action) actionMapList[i] = indexArray(q.action);
      if (q.targetIdIfPresent) targetIdIfPresentMapList[i] = indexArray(q.targetIdIfPresent);
      if (q.targetType) targetTypeMapList[i] = indexArray(q.targetType);
      if (q.containerId)
        containerIdMapList[i] = indexArray(q.containerId, {
          reducer: (u1, u2, index) => {
            // Avoid `0` because it resolves to false in later checks.
            return index + 1;
          },
        });
      if (q.appliesTo) appliesToMapList[i] = indexArray(q.appliesTo);
    });

    for (const entityId of props.entities) {
      const index = MemoryCacheIndexHelper.getIndex({
        key: entityId,
        index: permissionEntitiesIndex,
      });
      let entityPermissionItems = await props.context.memory.permissionItem.getDataList(index);

      if (props.andQueries) {
        entityPermissionItems.forEach(item => {
          props.andQueries!.forEach((q, i) => {
            const targetIdMap = targetIdMapList[i],
              actionMap = actionMapList[i],
              targetIdIfPresentMap = targetIdIfPresentMapList[i],
              targetTypeMap = targetTypeMapList[i],
              containerIdMap = containerIdMapList[i],
              appliesToMap = appliesToMapList[i];

            if (targetIdMap && (!item.targetId || !targetIdMap[item.targetId])) return;
            if (actionMap && (!item.action || !actionMap[item.action])) return;
            if (targetIdIfPresentMap && item.targetId && !targetIdIfPresentMap[item.targetId])
              return;
            if (targetTypeMap && !targetTypeMap[item.targetType]) return;
            if (containerIdMap && !containerIdMap[item.containerId]) return;
            if (appliesToMap && !appliesToMap[item.appliesTo]) return;

            pItemsList[i];
          });
        });
      } else {
        pItemsList[0] = entityPermissionItems;
      }
    }

    if (props.sortByDate || props.sortByContainer) {
      pItemsList.forEach((pItems, i) => {
        pItems.sort((item01, item02) => {
          if (item01.entityId !== item02.entityId) {
            // Maintain current order if they do not belong to the same entity.
            return -1;
          }

          if (props.sortByDate) {
            if (item01.containerId === item02.containerId)
              return item01.lastUpdatedAt - item02.lastUpdatedAt;
          }

          const containerIdMap = containerIdMapList[i];
          if (props.sortByContainer && containerIdMap) {
            if (item01.containerId !== item02.containerId) {
              return (
                (containerIdMap[item01.containerId] ?? Number.MAX_SAFE_INTEGER) -
                (containerIdMap[item02.containerId] ?? Number.MAX_SAFE_INTEGER)
              );
            }
          }

          // Maintain current order.
          return -1;
        });
      });
    }

    return pItemsList;
  }

  async getEntity(props: {context: IBaseContext; entityId: string}) {
    const type = getResourceTypeFromId(props.entityId);
    if (type === AppResourceType.User)
      return await props.context.memory.user.getById(props.entityId);
    if (type === AppResourceType.UserToken)
      return await props.context.memory.userToken.getById(props.entityId);
    if (type === AppResourceType.ProgramAccessToken)
      return await props.context.memory.programAccessToken.getById(props.entityId);
    if (type === AppResourceType.ClientAssignedToken)
      return await props.context.memory.clientAssignedToken.getById(props.entityId);
    if (type === AppResourceType.PermissionGroup)
      return await props.context.memory.permissionGroup.getById(props.entityId);
    return null;
  }
}
