import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAssignedItemProvider} from './types';

export class MemorySemanticDataAccessAssignedItem
  extends SemanticDataAccessWorkspaceResourceProvider<IAssignedItem>
  implements ISemanticDataAccessAssignedItemProvider
{
  async deleteAssignedItemResources(id: string | string[]): Promise<void> {}

  async deleteResourceAssignedItems(
    id: string | string[],
    types?: AppResourceType | AppResourceType[] | undefined
  ): Promise<void> {}
}
