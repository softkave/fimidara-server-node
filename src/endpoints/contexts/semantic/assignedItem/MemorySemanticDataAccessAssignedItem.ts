import {AssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {toNonNullableArray} from '../../../../utils/fns';
import {AnyObject} from '../../../../utils/types';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  SemanticDataAccessProviderMutationRunOptions,
} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAssignedItemProvider} from './types';

export class MemorySemanticDataAccessAssignedItem
  extends SemanticDataAccessWorkspaceResourceProvider<AssignedItem>
  implements ISemanticDataAccessAssignedItemProvider
{
  async getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (IDataProvideQueryListParams<AssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.memstore.readManyItems(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }

  async getWorkspaceResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[] | undefined,
    options?:
      | (IDataProvideQueryListParams<AssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.memstore.readManyItems(
      {
        workspaceId,
        assignedItemType: assignedItemType
          ? {$in: toNonNullableArray(assignedItemType) as any[]}
          : undefined,
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }

  async getUserWorkspaces(
    assigneeId: string,
    options?:
      | (IDataProvideQueryListParams<AssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.memstore.readManyItems(
      {assigneeId, assignedItemType: AppResourceType.Workspace},
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }

  async existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (IDataProvideQueryListParams<AssignedItem<AnyObject>> &
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

  async deleteWorkspaceAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
      },
      opts.transaction
    );
  }

  async deleteWorkspaceResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
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
