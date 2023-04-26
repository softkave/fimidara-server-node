import {RemoveCollaboratorCascadeFnsArgs} from '../endpoints/collaborators/removeCollaborator/types';
import {DeleteFileCascadeDeleteFnsArgs} from '../endpoints/files/deleteFile/types';
import {DeletePermissionItemsCascadeFnsArgs} from '../endpoints/permissionItems/deleteItems/types';
import {DeleteResourceCascadeFnDefaultArgs} from '../endpoints/types';
import {AnyObject} from '../utils/types';
import {AppResourceType, Resource} from './system';

export enum JobType {
  DeleteResource = 'deleteResource',
}

export enum JobStatus {
  Pending = 'pending',
  InProgress = 'inProgress',
  Completed = 'completed',
  Failed = 'failed',
}

export interface Job extends Resource {
  type: JobType;
  params: AnyObject;
  status: JobStatus;
  statusDate: number;
  version: number;
  serverInstanceId: string;
  workspaceId?: string;

  /** For checking the logs for the error that occurred during the job run. */
  errorTimestamp?: number;
}

export type DeleteResourceJobParams =
  | {
      type:
        | AppResourceType.Workspace
        | AppResourceType.AgentToken
        | AppResourceType.Folder
        | AppResourceType.Tag
        | AppResourceType.PermissionGroup
        | AppResourceType.CollaborationRequest;
      args: DeleteResourceCascadeFnDefaultArgs;
    }
  | {
      type: AppResourceType.User;
      args: RemoveCollaboratorCascadeFnsArgs;
      isRemoveCollaborator: true;
    }
  | {
      type: AppResourceType.File;
      args: DeleteFileCascadeDeleteFnsArgs;
    }
  | {
      type: AppResourceType.PermissionItem;
      args: DeletePermissionItemsCascadeFnsArgs;
    }
  | {
      type: AppResourceType.Workspace;
      args: DeletePermissionItemsCascadeFnsArgs;
    };

export const JOB_RUNNER_V1 = 1;
