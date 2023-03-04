import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessAssignedItemProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IAssignedItem> {
  getByAssignedAndAssigneeIds(
    assignedItemId: string | string[],
    assigneeId: string | string[]
  ): Promise<IAssignedItem[]>;
  getResourceAssignedItems(
    id: string | string[],
    types?: AppResourceType | AppResourceType[]
  ): Promise<IAssignedItem[]>;
  deleteResourceAssignedItems(
    id: string | string[],
    types?: AppResourceType | AppResourceType[]
  ): Promise<void>;
  deleteAssignedItemResources(id: string | string[]): Promise<void>;
}
