import {AssignedItem} from '../../../../definitions/assignedItem';
import {Agent, AppResourceType} from '../../../../definitions/system';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderQueryListRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticAssignedItemProvider
  extends SemanticWorkspaceResourceProviderType<AssignedItem> {
  getByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: SemanticProviderQueryListRunOptions<AssignedItem>
  ): Promise<AssignedItem[]>;
  existsByWorkspaceAssignedAndAssigneeIds(
    workspaceId: string,
    assignedItemId: string | string[],
    assigneeId: string | string[],
    options?: SemanticProviderQueryListRunOptions<AssignedItem>
  ): Promise<boolean>;
  getByAssignee(
    workspaceId: string | undefined,
    assigneeId: string | string[],
    assignedItemType?: AppResourceType | AppResourceType[],
    options?: SemanticProviderQueryListRunOptions<AssignedItem>
  ): Promise<AssignedItem[]>;
  getByAssigned(
    workspaceId: string | undefined,
    assignedItemId: string | string[],
    options?: SemanticProviderQueryListRunOptions<AssignedItem>
  ): Promise<AssignedItem[]>;
  getUserWorkspaces(
    assigneeId: string,
    options?: SemanticProviderQueryListRunOptions<AssignedItem>
  ): Promise<AssignedItem[]>;
  deleteByAssigned(
    workspaceId: string,
    assignedId: string | string[],
    assignedItemType: AppResourceType | AppResourceType[] | undefined,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  /** Deletes items resource is assigned to. */
  deleteByAssignee(
    workspaceId: string,
    assigneeItemId: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  softDeleteWorkspaceCollaborators(
    workspaceId: string,
    assigneeId: string | string[],
    agent: Agent,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
}
