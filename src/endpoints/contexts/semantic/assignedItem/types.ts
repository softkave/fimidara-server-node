import {AssignedItem} from '../../../../definitions/assignedItem';
import {Agent, FimidaraResourceType} from '../../../../definitions/system';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticAssignedItemProvider
  extends SemanticWorkspaceResourceProviderType<AssignedItem> {
  getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: SemanticProviderQueryListParams<AssignedItem>
  ): Promise<AssignedItem[]>;
  existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: SemanticProviderOpParams
  ): Promise<boolean>;
  getByAssignee(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: FimidaraResourceType | FimidaraResourceType[],
    options?: SemanticProviderQueryListParams<AssignedItem>
  ): Promise<AssignedItem[]>;
  getByAssigned(
    workspaceId: string | undefined,
    assignedItemId: string | string[],
    options?: SemanticProviderQueryListParams<AssignedItem>
  ): Promise<AssignedItem[]>;
  getUserWorkspaces(
    assigneeId: string,
    options?: SemanticProviderQueryListParams<AssignedItem>
  ): Promise<AssignedItem[]>;
  deleteByAssigned(
    workspaceId: string,
    assignedId: string | string[],
    assignedItemType: FimidaraResourceType | FimidaraResourceType[] | undefined,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  /** Deletes items resource is assigned to. */
  deleteByAssignee(
    workspaceId: string,
    assigneeItemId: string | string[],
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  softDeleteWorkspaceCollaborators(
    workspaceId: string,
    assigneeId: string | string[],
    agent: Agent,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
}
