import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {toNonNullableArray} from '../../../../utils/fns';
import {AnyObject} from '../../../../utils/types';
import {IDataProvideQueryListParams} from '../../data/types';
import {getMongoQueryOptionsForMany} from '../../data/utils';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAssignedItemProvider} from './types';

export class MemorySemanticDataAccessAssignedItem
  extends SemanticDataAccessWorkspaceResourceProvider<IAssignedItem>
  implements ISemanticDataAccessAssignedItemProvider
{
  async getByAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (IDataProvideQueryListParams<IAssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<IAssignedItem<AnyObject>[]> {
    const opts = getMongoQueryOptionsForMany(options);
    return await this.memstore.readManyItems(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options?.transaction,
      opts.limit,
      opts.skip
    );
  }

  async getResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[] | undefined,
    options?:
      | (IDataProvideQueryListParams<IAssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<IAssignedItem<AnyObject>[]> {
    const opts = getMongoQueryOptionsForMany(options);
    return await this.memstore.readManyItems(
      {
        workspaceId,
        assignedItemType: assignedItemType
          ? {$in: toNonNullableArray(assignedItemType) as any[]}
          : undefined,
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options?.transaction,
      opts.limit,
      opts.skip
    );
  }

  async existsByAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (IDataProvideQueryListParams<IAssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<boolean> {
    return await this.memstore.exists(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options?.transaction
    );
  }

  async deleteAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
      },
      opts.transaction
    );
  }

  async deleteResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(
      {
        workspaceId,
        assignedItemType: assignedItemType
          ? {$in: toNonNullableArray(assignedItemType) as any[]}
          : undefined,
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      opts.transaction
    );
  }
}
