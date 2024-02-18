import {AssignedItem} from '../../../../definitions/assignedItem';
import {Agent, AppResourceType, kAppResourceType} from '../../../../definitions/system';
import {getTimestamp} from '../../../../utils/dateFns';
import {convertToArray, toCompactArray} from '../../../../utils/fns';
import {AnyObject} from '../../../../utils/types';
import {DataProviderQueryListParams, DataQuery} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderQueryListRunOptions,
  SemanticProviderTxnOptions,
} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticAssignedItemProvider} from './types';

export class DataSemanticAssignedItem
  extends DataSemanticWorkspaceResourceProvider<AssignedItem>
  implements SemanticAssignedItemProvider
{
  async getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderTxnOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedItemId)},
        assigneeId: {$in: toCompactArray(assigneeId)},
      },
      options
    );
  }

  async getByAssignee(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[] | undefined,
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderTxnOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId,
        assigneeId: {$in: toCompactArray(assigneeId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      options
    );
  }

  async getByAssigned(
    workspaceId: string | undefined,
    assignedItemId: string | string[],
    options?: SemanticProviderQueryListRunOptions<AssignedItem>
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {workspaceId, assignedItemId: {$in: toCompactArray(assignedItemId)}},
      options
    );
  }

  async getUserWorkspaces(
    assigneeId: string,
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderTxnOptions)
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    return await this.data.getManyByQuery(
      {assigneeId, assignedItemType: kAppResourceType.Workspace},
      options
    );
  }

  async existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | (DataProviderQueryListParams<AssignedItem<AnyObject>> &
          SemanticProviderTxnOptions)
      | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedItemId)},
        assigneeId: {$in: toCompactArray(assigneeId)},
      },
      options
    );
  }

  async deleteByAssignee(
    workspaceId: string,
    assigneeItemId: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {
        workspaceId,
        assigneeId: {$in: toCompactArray(assigneeItemId)},
      },
      opts
    );
  }

  async softDeleteWorkspaceCollaborators(
    workspaceId: string,
    assigneeId: string | string[],
    agent: Agent,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    const query: DataQuery<AssignedItem> = {
      assignedItemId: workspaceId,
      assigneeId: {$in: convertToArray(assigneeId)},
    };
    const update: Partial<AssignedItem> = {
      isDeleted: true,
      deletedAt: getTimestamp(),
      deletedBy: agent,
    };
    await this.data.updateManyByQuery(query, update, opts);
  }

  async deleteByAssigned(
    workspaceId: string,
    assignedId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      opts
    );
  }
}
