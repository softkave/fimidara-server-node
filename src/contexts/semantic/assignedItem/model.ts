import {AnyObject} from 'softkave-js-utils';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {
  Agent,
  FimidaraResourceType,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {convertToArray, toCompactArray} from '../../../utils/fns.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
} from '../types.js';
import {getInAndNinQuery} from '../utils.js';
import {SemanticAssignedItemProvider} from './types.js';

export class DataSemanticAssignedItem
  extends SemanticWorkspaceResourceProvider<AssignedItem>
  implements SemanticAssignedItemProvider
{
  async getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?:
      | SemanticProviderQueryListParams<AssignedItem<AnyObject>>
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedItemId)},
        assigneeId: {$in: toCompactArray(assigneeId)},
      },
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, options);
  }

  async getByAssignee(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?:
      | FimidaraResourceType
      | FimidaraResourceType[]
      | undefined,
    options?:
      | SemanticProviderQueryListParams<AssignedItem<AnyObject>>
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {
        workspaceId,
        assigneeId: {$in: toCompactArray(assigneeId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, options);
  }

  async getByAssigned(
    workspaceId: string | undefined,
    assignedItemId: string | string[],
    options?: SemanticProviderQueryListParams<AssignedItem>
  ): Promise<AssignedItem<AnyObject>[]> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {workspaceId, assignedItemId: {$in: toCompactArray(assignedItemId)}},
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, options);
  }

  async getUserWorkspaces(
    assigneeId: string,
    options?:
      | SemanticProviderQueryListParams<AssignedItem<AnyObject>>
      | undefined
  ): Promise<AssignedItem<AnyObject>[]> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {assigneeId, assignedItemType: kFimidaraResourceType.Workspace},
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, options);
  }

  async existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedItemId)},
        assigneeId: {$in: toCompactArray(assigneeId)},
      },
      options?.includeDeleted || false
    );
    return await this.data.existsByQuery(query, options);
  }

  async deleteByAssignee(
    workspaceId: string,
    assigneeItemId: string | string[],
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {workspaceId, assigneeId: {$in: toCompactArray(assigneeItemId)}},
      opts?.includeDeleted || true
    );
    await this.data.deleteManyByQuery(query, opts);
  }

  async softDeleteWorkspaceCollaborators(
    workspaceId: string,
    assigneeId: string | string[],
    agent: Agent,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {
        assignedItemId: workspaceId,
        assigneeId: {$in: convertToArray(assigneeId)},
      },
      opts?.includeDeleted || true
    );
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
    assignedItemType: FimidaraResourceType | FimidaraResourceType[] | undefined,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
      {
        workspaceId,
        assignedItemId: {$in: toCompactArray(assignedId)},
        ...getInAndNinQuery<AssignedItem>('assignedItemType', assignedItemType),
      },
      opts?.includeDeleted || true
    );
    await this.data.deleteManyByQuery(query, opts);
  }
}
