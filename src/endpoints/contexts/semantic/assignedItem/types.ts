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
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<IAssignedItem[]>;
  getResourceAssignedItems(
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[],
    options?: IDataProvideQueryListParams<IAssignedItem> & ISemanticDataAccessProviderRunOptions
  ): Promise<IAssignedItem[]>;
  deleteResourceAssignedItems(
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteAssignedItemResources(
    assignedItemId: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
