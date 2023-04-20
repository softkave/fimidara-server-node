import {AssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
  SemanticDataAccessProviderMutationRunOptions,
} from '../types';

export interface ISemanticDataAccessAssignedItemProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<AssignedItem> {
  getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<AssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<AssignedItem[]>;
  existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<AssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  getWorkspaceResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[],
    options?: IDataProvideQueryListParams<AssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<AssignedItem[]>;
  getUserWorkspaces(
    assigneeId: string,
    options?: IDataProvideQueryListParams<AssignedItem> & ISemanticDataAccessProviderRunOptions
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
