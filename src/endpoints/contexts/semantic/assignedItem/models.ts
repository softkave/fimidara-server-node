import {AssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType, kAppResourceType} from '../../../../definitions/system';
import {toNonNullableArray} from '../../../../utils/fns';
import {AnyObject} from '../../../../utils/types';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticWorkspaceResourceProvider';
import {SemanticProviderMutationRunOptions, SemanticProviderRunOptions} from '../types';
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
          SemanticProviderRunOptions)
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
        assignedItemId: {$in: toNonNullableArray(assignedItemId)},
        assigneeId: {$in: toNonNullableArray(assigneeId)},
      },
      options
    );
  }

  async deleteWorkspaceAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: SemanticProviderMutationRunOptions
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
    opts: SemanticProviderMutationRunOptions
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
