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
  getByAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<IAssignedItem[]>;
  existsByAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  getResourceAssignedItems(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<IAssignedItem[]>;
  deleteResourceAssignedItems(
    workspaceId: string,
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteAssignedItemResources(
    workspaceId: string,
    assignedItemId: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
