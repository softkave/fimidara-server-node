import {AssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessAssignedItemProvider
  extends SemanticDataAccessWorkspaceResourceProviderType<AssignedItem> {
  getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<AssignedItem> & SemanticDataAccessProviderRunOptions
  ): Promise<AssignedItem[]>;
  existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<AssignedItem> & SemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  getWorkspaceResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[],
    options?: IDataProvideQueryListParams<AssignedItem> & SemanticDataAccessProviderRunOptions
  ): Promise<AssignedItem[]>;
  getUserWorkspaces(
    assigneeId: string,
    options?: IDataProvideQueryListParams<AssignedItem> & SemanticDataAccessProviderRunOptions
  ): Promise<AssignedItem[]>;
  deleteWorkspaceResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteWorkspaceAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
