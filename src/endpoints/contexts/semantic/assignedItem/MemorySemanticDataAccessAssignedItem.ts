import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AppResourceType} from '../../../../definitions/system';
import {toArray} from '../../../../utils/fns';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {AnyObject} from '../../../../utils/types';
import {IDataProvideQueryListParams} from '../../data/types';
import {getMongoQueryOptionsForMany} from '../../data/utils';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessAssignedItemProvider} from './types';

export class MemorySemanticDataAccessAssignedItem
  extends SemanticDataAccessWorkspaceResourceProvider<IAssignedItem>
  implements ISemanticDataAccessAssignedItemProvider
{
  async deleteAssignedItemResources(
    assignedItemId: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteResourceAssignedItems(
    assigneeId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async getByAssignedAndAssigneeIds(
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (IDataProvideQueryListParams<IAssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<IAssignedItem<AnyObject>[]> {
    const opts = getMongoQueryOptionsForMany(options);
    return await this.memstore.readManyItems(
      {
        assignedItemId: {$in: toArray(assignedItemId)},
        assigneeId: {$in: toArray(assigneeId)},
      },
      options?.transaction,
      opts.limit,
      opts.skip
    );
  }

  async getResourceAssignedItems(
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[] | undefined,
    options?:
      | (IDataProvideQueryListParams<IAssignedItem<AnyObject>> &
          ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<IAssignedItem<AnyObject>[]> {
    const opts = getMongoQueryOptionsForMany(options);
    return await this.memstore.readManyItems(
      {
        assignedItemType: assignedItemType ? {$in: toArray(assignedItemType) as any[]} : undefined,
        assigneeId: {$in: toArray(assigneeId)},
      },
      options?.transaction,
      opts.limit,
      opts.skip
    );
  }
}
