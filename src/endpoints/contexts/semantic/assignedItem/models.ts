import {AssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {toNonNullableArray} from '../../../../utils/fns';
import {AnyObject} from '../../../../utils/types';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticDataAccessAssignedItemProvider} from './types';

export class DataSemanticDataAccessAssignedItem
  extends DataSemanticDataAccessWorkspaceResourceProvider<AssignedItem>
  implements SemanticDataAccessAssignedItemProvider
{
  async getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options
    );
  }

  async getWorkspaceResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[] | undefined,
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId,
        assigneeId: {$in: toNonNullableArray(assigneeId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      options
    );
  }

  async getUserWorkspaces(
    assigneeId: string,
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {assigneeId, assignedItemType: AppResourceType.Workspace},
      options
    );
  }

  async existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options
    );
  }

  async deleteWorkspaceAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
      },
      opts
    );
  }

  async deleteWorkspaceResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {
        workspaceId,
        assigneeId: {$in: toNonNullableArray(assigneeId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      opts
    );
  }
}
