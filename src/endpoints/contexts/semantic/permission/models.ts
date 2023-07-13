import {last} from 'lodash';
import {
  AssignedPermissionGroupMeta,
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionItem, PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {AppActionType, AppResourceType, Resource} from '../../../../definitions/system';
import {appAssert} from '../../../../utils/assertion';
import {toArray, toNonNullableArray} from '../../../../utils/fns';
import {indexArray} from '../../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../../utils/resource';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {DataQuery, LiteralDataQuery} from '../../data/types';
import {BaseContextType} from '../../types';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {
  SemanticDataAccessPermissionProviderType,
  SemanticDataAccessPermissionProviderType_CountPermissionItemsProps,
  SemanticDataAccessPermissionProviderType_GetPermissionItemsProps,
} from './types';

const containerSpecificAppliesToList: PermissionItemAppliesTo[] = [
  PermissionItemAppliesTo.SelfAndChildrenOfType,
  PermissionItemAppliesTo.ChildrenOfType,
];
const targetSpecificAppliesToList: PermissionItemAppliesTo[] = [
  PermissionItemAppliesTo.Self,
  PermissionItemAppliesTo.SelfAndChildrenOfType,
];
const containerSpecificAppliesToMap = indexArray(containerSpecificAppliesToList);
const targetSpecificAppliesToMap = indexArray(targetSpecificAppliesToList);

export class DataSemanticDataAccessPermission implements SemanticDataAccessPermissionProviderType {
  async getEntityInheritanceMap(
    props: {
      context: BaseContextType;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<PermissionEntityInheritanceMap> {
    {
      const {context} = props;
      const entity = this.getEntity(props);
      appAssert(entity, reuseableErrors.entity.notFound(props.entityId));

      let nextIdList = [props.entityId];
      const map: PermissionEntityInheritanceMap = {
        [props.entityId]: {id: props.entityId, items: []},
      };
      const maxDepth = props.fetchDeep ? 20 : 1;

      for (let depth = 0; nextIdList.length && depth < maxDepth; depth++) {
        const assignedItems = await context.semantic.assignedItem.getManyByQuery(
          {assigneeId: {$in: nextIdList}, assignedItemType: AppResourceType.PermissionGroup},
          options
        );
        const nextIdMap: Record<string, string> = {};
        assignedItems.forEach(item => {
          nextIdMap[item.assignedItemId] = item.assignedItemId;
          map[item.assignedItemId] = {id: item.assignedItemId, items: []};
          const entry = map[item.assigneeId];

          if (entry) {
            const meta: AssignedPermissionGroupMeta = {
              assignedAt: item.createdAt,
              assignedBy: item.createdBy,
              permissionGroupId: item.assignedItemId,
              assigneeEntityId: item.assigneeId,
            };
            entry.items.push(meta);
          }
        });
        nextIdList = Object.values(nextIdMap);
      }

      return map;
    }
  }

  async getEntityAssignedPermissionGroups(
    props: {
      context: BaseContextType;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }> {
    const map = await this.getEntityInheritanceMap(props, options);
    const idList = Object.keys(map).filter(id => id !== props.entityId);
    const permissionGroups = await props.context.semantic.permissionGroup.getManyByQuery(
      {resourceId: {$in: idList}},
      options
    );
    return {permissionGroups, inheritanceMap: map};
  }

  async getPermissionItems(
    props: SemanticDataAccessPermissionProviderType_GetPermissionItemsProps,
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<PermissionItem[]> {
    const {containeritemsquery, targetitemsquery} = this.getPermissionItemsQuery(props);

    // TODO: use $or query when implemented
    const [itemsFromContainer, itemsFromTarget] = await Promise.all([
      containeritemsquery
        ? props.context.semantic.permissionItem.getManyByQuery(containeritemsquery, options)
        : ([] as PermissionItem[]),
      targetitemsquery
        ? props.context.semantic.permissionItem.getManyByQuery(targetitemsquery, options)
        : ([] as PermissionItem[]),
    ]);

    if (props.sortByContainer && props.containerId) {
      this.sortByContainer(props.containerId, itemsFromContainer, props.sortByDate);
    }
    if (props.sortByDate) {
      this.sortByDate(itemsFromTarget);
    }

    const items = itemsFromTarget.concat(itemsFromContainer);
    return items;
  }

  async countPermissionItems(
    props: SemanticDataAccessPermissionProviderType_CountPermissionItemsProps,
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    const {containeritemsquery, targetitemsquery} = this.getPermissionItemsQuery(props);

    // TODO: use $or query when implemented
    const [count01, count02] = await Promise.all([
      containeritemsquery
        ? props.context.semantic.permissionItem.countByQuery(containeritemsquery, options)
        : 0,
      targetitemsquery
        ? props.context.semantic.permissionItem.countByQuery(targetitemsquery, options)
        : 0,
    ]);

    return count01 + count02;
  }

  async getEntity(
    props: {
      context: BaseContextType;
      entityId: string;
    },
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<Resource | null> {
    const type = getResourceTypeFromId(props.entityId);
    const query: LiteralDataQuery<Resource> = {resourceId: props.entityId};
    if (type === AppResourceType.User)
      return await props.context.semantic.user.getOneByQuery(query, opts);
    if (type === AppResourceType.AgentToken)
      return await props.context.semantic.agentToken.getOneByQuery(query, opts);
    if (type === AppResourceType.PermissionGroup)
      return await props.context.semantic.permissionGroup.getOneByQuery(query, opts);
    return null;
  }

  sortByDate(items: PermissionItem[]): PermissionItem[] {
    return items.sort((item01, item02) => {
      return item02.lastUpdatedAt - item01.lastUpdatedAt;
    });
  }

  sortByContainer(
    containerId: string | string[],
    items: PermissionItem[],
    sortByDate?: boolean
  ): PermissionItem[] {
    const containerIdMap = indexArray(toNonNullableArray(containerId), {
      reducer: (item, arr, i) => i,
    });
    return items.sort((item01, item02) => {
      if (item01.targetId !== item01.targetId) {
        if (containerIdMap) {
          return (
            (containerIdMap[item01.targetId] ?? Number.MAX_SAFE_INTEGER) -
            (containerIdMap[item02.targetId] ?? Number.MAX_SAFE_INTEGER)
          );
        }
      } else if (sortByDate) {
        return item01.lastUpdatedAt - item02.lastUpdatedAt;
      }

      // Maintain current order.
      return -1;
    });
  }

  protected getPermissionItemsQuery(props: {
    entityId?: string | string[];
    action?: AppActionType | AppActionType[];
    targetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];
    containerAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
    targetAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  }) {
    let containeritemsquery: DataQuery<PermissionItem> | undefined = undefined;
    let targetitemsquery: DataQuery<PermissionItem> | undefined = undefined;

    if (props.containerId) {
      containeritemsquery = {
        appliesTo: {$in: this.getContainerAppliesTo(props.containerAppliesTo) as any},
        ...getInAndNinQuery<PermissionItem>('targetId', props.containerId),
        ...getInAndNinQuery<PermissionItem>('entityId', props.entityId),
        ...getInAndNinQuery<PermissionItem>('action', props.action),
        ...getInAndNinQuery<PermissionItem>('targetType', props.targetType),
      };
    }

    if (props.targetId) {
      targetitemsquery = {
        appliesTo: {$in: this.getTargetAppliesTo(props.targetAppliesTo) as any},
        ...getInAndNinQuery<PermissionItem>('targetId', props.targetId),
        ...getInAndNinQuery<PermissionItem>('entityId', props.entityId),
        ...getInAndNinQuery<PermissionItem>('action', props.action),
        ...getInAndNinQuery<PermissionItem>('targetType', props.targetType),
      };
    } else if (props.containerId && props.targetType) {
      const targetParentId = props.containerId ? last(toArray(props.containerId)) : undefined;
      targetitemsquery = {
        targetParentId,
        appliesTo: {$in: this.getTargetAppliesTo(props.targetAppliesTo) as any},
        ...getInAndNinQuery<PermissionItem>('entityId', props.entityId),
        ...getInAndNinQuery<PermissionItem>('action', props.action),
        ...getInAndNinQuery<PermissionItem>('targetType', props.targetType),
      };
    }

    // For when we want to fetch an entity's permissions regardless of container
    // or target
    if (!containeritemsquery && !targetitemsquery && props.entityId) {
      containeritemsquery = {
        ...getInAndNinQuery<PermissionItem>('entityId', props.entityId),
        ...getInAndNinQuery<PermissionItem>('action', props.action),
        ...getInAndNinQuery<PermissionItem>('targetType', props.targetType),
      };
    }

    return {containeritemsquery, targetitemsquery};
  }

  protected getContainerAppliesTo(appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[]) {
    if (appliesTo) {
      return toArray(appliesTo).filter(next => containerSpecificAppliesToMap[next]);
    } else {
      return containerSpecificAppliesToList;
    }
  }

  protected getTargetAppliesTo(appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[]) {
    if (appliesTo) {
      return toArray(appliesTo).filter(next => targetSpecificAppliesToMap[next]);
    } else {
      return targetSpecificAppliesToList;
    }
  }
}
