import {AssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType, kAppResourceType} from '../../../../definitions/system';
import {toCompactArray} from '../../../../utils/fns';
import {AnyObject} from '../../../../utils/types';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderQueryListRunOptions,
  SemanticProviderRunOptions,
} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticAssignedItemProvider} from './types';

export class DataSemanticAssignedItem
  extends DataSemanticWorkspaceResourceProvider<AssignedItem>
  implements SemanticAssignedItemProvider
{
  async getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedItemId)},
        assigneeId: {$in: toCompactArray(assigneeId)},
      },
      options
    );
  }

  async getResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[] | undefined,
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId,
        assigneeId: {$in: toCompactArray(assigneeId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      options
    );
  }

  async getResourceAssigneeItems(
    workspaceId: string | undefined,
    assignedItemId: string | string[],
    options?: SemanticProviderQueryListRunOptions<AssignedItem>
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {workspaceId, assignedItemId: {$in: toCompactArray(assignedItemId)}},
      options
    );
  }

  async getUserWorkspaces(
    assigneeId: string,
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderRunOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {assigneeId, assignedItemType: kAppResourceType.Workspace},
      options
    );
  }

  async existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderRunOptions)
      | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedItemId)},
        assigneeId: {$in: toCompactArray(assigneeId)},
      },
      options
    );
  }

  async deleteResourceAssigneeItems(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedItemId)},
      },
      opts
    );
  }

  async deleteResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {
        workspaceId,
        assigneeId: {$in: toCompactArray(assigneeId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      opts
    );
  }
}
