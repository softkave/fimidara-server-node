import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {AnyObject} from '../../../../utils/types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAssignedItemProvider} from './types';

export class MemorySemanticDataAccessAssignedItem
  extends SemanticDataAccessWorkspaceResourceProvider<IAssignedItem>
  implements ISemanticDataAccessAssignedItemProvider
{
  async deleteAssignedItemResources(id: string | string[]): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteResourceAssignedItems(
    id: string | string[],
    types?: AppResourceType | AppResourceType[] | undefined
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async getByAssignedAndAssigneeIds(
    assignedItemId: string | string[],
    assigneeId: string | string[]
  ): Promise<IAssignedItem<AnyObject>[]> {
    throw reuseableErrors.common.notImplemented();
  }

  async getResourceAssignedItems(
    id: string | string[],
    types?: AppResourceType | AppResourceType[] | undefined
  ): Promise<IAssignedItem<AnyObject>[]> {
    throw reuseableErrors.common.notImplemented();
  }
}
