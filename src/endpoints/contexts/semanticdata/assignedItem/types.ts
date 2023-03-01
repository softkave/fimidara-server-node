import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessAssignedItemProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IAssignedItem> {
  deleteResourceAssignedItems(
    id: string | string[],
    types?: AppResourceType | AppResourceType[]
  ): Promise<void>;
  deleteAssignedItemResources(id: string | string[]): Promise<void>;
}
