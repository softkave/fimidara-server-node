import {uniq} from 'lodash';
import {
  IAssignedPermissionGroupMeta,
  IPermissionGroup,
  PermissionEntityInheritanceMap,
} from '../../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, IResource} from '../../../../definitions/system';
import {IAppVariables} from '../../../../resources/vars';
import {appAssert} from '../../../../utils/assertion';
import {toArray, toCompactArray} from '../../../../utils/fns';
import {indexArray} from '../../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../../utils/resourceId';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {INCLUDE_IN_PROJECTION, LiteralDataQuery} from '../../data/types';
import {IEmailProviderContext} from '../../EmailProviderContext';
import {IFilePersistenceProviderContext} from '../../FilePersistenceProviderContext';
import {
  IBaseContext,
  IBaseContextDataProviders,
  IBaseContextLogicProviders,
  IBaseContextMemStoreProviders,
  IBaseContextSemanticDataProviders,
} from '../../types';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
} from '../types';
import {ISemanticDataAccessPermissionProvider} from './types';

export class MemorySemanticDataAccessPermission implements ISemanticDataAccessPermissionProvider {
  async getEntityInheritanceMap(
    props: {
      context: IBaseContext<
        IBaseContextDataProviders,
        IEmailProviderContext,
        IFilePersistenceProviderContext,
        IAppVariables,
        IBaseContextMemStoreProviders,
        IBaseContextLogicProviders,
        IBaseContextSemanticDataProviders
      >;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<PermissionEntityInheritanceMap> {
    {
      const {context} = props;
      const entity = this.getEntity(props);
      appAssert(entity, reuseableErrors.entity.notFound(props.entityId));

      const map: PermissionEntityInheritanceMap = {};
      const maxDepth = props.fetchDeep ? 100 : 1;
      let nextIdList = [props.entityId];

      for (let depth = 0; nextIdList.length && depth < maxDepth; depth++) {
        const nextIdMap: Record<string, number> = {};
        const assignedItems = await context.memstore.assignedItem.readManyItems(
          {assigneeId: {$in: nextIdList}},
          options?.transaction
        );
        assignedItems.forEach(item => {
          nextIdMap[item.assignedItemId] = INCLUDE_IN_PROJECTION;
          let entry = map[item.assigneeId];
          if (!entry) {
            map[item.assigneeId] = entry = {
              id: item.assigneeId,
              items: [],
            };
          }

          const meta: IAssignedPermissionGroupMeta = {
            assignedAt: item.createdAt,
            assignedBy: item.createdBy,
            permissionGroupId: item.assignedItemId,
            assigneeEntityId: item.assigneeId,
          };
          entry.items.push(meta);
        });
        nextIdList = Object.keys(nextIdMap);
      }

      return map;
    }
  }

  async getEntityAssignedPermissionGroups(
    props: {
      context: IBaseContext<
        IBaseContextDataProviders,
        IEmailProviderContext,
        IFilePersistenceProviderContext,
        IAppVariables,
        IBaseContextMemStoreProviders,
        IBaseContextLogicProviders,
        IBaseContextSemanticDataProviders
      >;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<{
    permissionGroups: IPermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }> {
    const map = await this.getEntityInheritanceMap(props);
    const idList = Object.keys(map);
    const permissionGroups = await props.context.memstore.permissionGroup.readManyItems(
      {resourceId: {$in: idList}},
      options?.transaction
    );
    return {permissionGroups, inheritanceMap: map};
  }

  async getEntitiesPermissionItems(
    props: {
      context: IBaseContext<
        IBaseContextDataProviders,
        IEmailProviderContext,
        IFilePersistenceProviderContext,
        IAppVariables,
        IBaseContextMemStoreProviders,
        IBaseContextLogicProviders,
        IBaseContextSemanticDataProviders
      >;
      entityId: string[];
      action?: BasicCRUDActions | BasicCRUDActions[] | undefined;
      targetId?: string | string[] | undefined;
      strictTargetId?: string | string[] | undefined;
      targetType?: AppResourceType | AppResourceType[] | undefined;
      containerId?: string | string[] | undefined;
      sortByDate?: boolean | undefined;
      sortByContainer?: boolean | undefined;
      sortByEntity?: boolean | undefined;
    },
    options?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<IPermissionItem[]> {
    const query: LiteralDataQuery<IPermissionItem> = this.getEntitiesPermissionItemsQuery(props);
    const items = await props.context.memstore.permissionItem.readManyItems(
      query,
      options?.transaction
    );

    if (props.sortByDate || props.sortByContainer || props.sortByEntity) {
      const entityIdMap = props.entityId
        ? indexArray(toCompactArray(props.entityId), {reducer: (item, arr, i) => i})
        : undefined;
      const containerIdMap = props.containerId
        ? indexArray(toCompactArray(props.containerId), {reducer: (item, arr, i) => i})
        : undefined;
      items.sort((item01, item02) => {
        if (item01.entityId !== item02.entityId) {
          if (entityIdMap) {
            return (
              (entityIdMap[item01.containerId] ?? Number.MAX_SAFE_INTEGER) -
              (entityIdMap[item02.containerId] ?? Number.MAX_SAFE_INTEGER)
            );
          } else {
            // Maintain current order if they do not belong to the same entity,
            // other sorting criteria that follow depend on this.
            return -1;
          }
        }

        if (props.sortByDate && item01.containerId === item02.containerId) {
          return item01.lastUpdatedAt - item02.lastUpdatedAt;
        }

        if (containerIdMap && item01.containerId !== item02.containerId) {
          return (
            (containerIdMap[item01.containerId] ?? Number.MAX_SAFE_INTEGER) -
            (containerIdMap[item02.containerId] ?? Number.MAX_SAFE_INTEGER)
          );
        }

        // Maintain current order.
        return -1;
      });
    }

    return items;
  }

  async deleteEntitiesPermissionItems(
    props: {
      context: IBaseContext<
        IBaseContextDataProviders,
        IEmailProviderContext,
        IFilePersistenceProviderContext,
        IAppVariables,
        IBaseContextMemStoreProviders,
        IBaseContextLogicProviders,
        IBaseContextSemanticDataProviders
      >;
      entityId: string[];
      action?: BasicCRUDActions | BasicCRUDActions[] | undefined;
      targetId?: string | string[] | undefined;
      strictTargetId?: string | string[] | undefined;
      targetType?: AppResourceType | AppResourceType[] | undefined;
      containerId?: string | string[] | undefined;
    },
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: LiteralDataQuery<IPermissionItem> = this.getEntitiesPermissionItemsQuery(props);
    throw reuseableErrors.common.notImplemented();
  }

  async getEntity(
    props: {
      context: IBaseContext<
        IBaseContextDataProviders,
        IEmailProviderContext,
        IFilePersistenceProviderContext,
        IAppVariables,
        IBaseContextMemStoreProviders,
        IBaseContextLogicProviders,
        IBaseContextSemanticDataProviders
      >;
      entityId: string;
    },
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<IResource | null> {
    const type = getResourceTypeFromId(props.entityId);
    const query: LiteralDataQuery<IResource> = {resourceId: props.entityId};
    if (type === AppResourceType.User)
      return await props.context.memstore.user.readItem(query, opts?.transaction);
    if (type === AppResourceType.AgentToken)
      return await props.context.memstore.agentToken.readItem(query, opts?.transaction);
    if (type === AppResourceType.PermissionGroup)
      return await props.context.memstore.permissionGroup.readItem(query, opts?.transaction);
    return null;
  }

  private getEntitiesPermissionItemsQuery(props: {
    entityId: string[];
    action?: BasicCRUDActions | BasicCRUDActions[];
    targetId?: string | string[];
    strictTargetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];
  }) {
    let query: LiteralDataQuery<IPermissionItem> = {};

    type T = keyof Parameters<
      ISemanticDataAccessPermissionProvider['getEntitiesPermissionItems']
    >[0];
    const keys: Array<[T, keyof IPermissionItem]> = [
      ['action', 'action'],
      ['containerId', 'containerId'],
      ['targetType', 'containerType'],
      ['entityId', 'entityId'],
    ];
    const extractKeys = <K1 extends string, K2 extends string>(
      keys: Array<[K1, K2]>,
      item: Partial<Record<K1, any>>
    ) => {
      const extract: Partial<Record<K2, any>> = {};
      for (const [k1, k2] of keys) {
        if (item[k1]) {
          extract[k2] = item[k1];
        }
      }
      return extract;
    };

    if (props.strictTargetId) {
      query = {
        ...extractKeys(keys, props),
        targetId: {$in: toArray(props.strictTargetId)},
      };
    } else {
      const targetType = uniq(
        toCompactArray(props.targetId)
          .map(getResourceTypeFromId)
          .concat(props.targetType ?? [])
      );
      const queryParts = extractKeys(keys, props);
      query = {
        ...queryParts,
        targetId: props.targetId
          ? {$in: toArray<string | null>(props.targetId).concat(null)}
          : null,
        targetType: targetType.length ? {$in: targetType as any} : undefined,
      };
    }

    return query;
  }
}
