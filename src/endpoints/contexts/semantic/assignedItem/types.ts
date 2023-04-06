import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessAssignedItemProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IAssignedItem> {
  getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<IAssignedItem[]>;
  existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  getWorkspaceResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<IAssignedItem[]>;
  getUserWorkspaces(
    assigneeId: string,
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<IAssignedItem[]>;
  deleteWorkspaceResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteWorkspaceAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
