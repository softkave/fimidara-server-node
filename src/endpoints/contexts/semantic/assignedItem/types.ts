import {AssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticAssignedItemProvider
  extends SemanticWorkspaceResourceProviderType<AssignedItem> {
  getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: DataProviderQueryListParams<AssignedItem> & SemanticProviderRunOptions
  ): Promise<AssignedItem[]>;
  existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: DataProviderQueryListParams<AssignedItem> & SemanticProviderRunOptions
  ): Promise<boolean>;
  getWorkspaceResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[],
    options?: DataProviderQueryListParams<AssignedItem> & SemanticProviderRunOptions
  ): Promise<AssignedItem[]>;
  getUserWorkspaces(
    assigneeId: string,
    options?: DataProviderQueryListParams<AssignedItem> & SemanticProviderRunOptions
  ): Promise<AssignedItem[]>;
  deleteWorkspaceResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  deleteWorkspaceAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
}
