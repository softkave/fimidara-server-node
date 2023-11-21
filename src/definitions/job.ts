import {RemoveCollaboratorCascadeFnsArgs} from '../endpoints/collaborators/removeCollaborator/types';
import {DeleteFileCascadeDeleteFnsArgs} from '../endpoints/files/deleteFile/types';
import {DeletePermissionItemsCascadeFnsArgs} from '../endpoints/permissionItems/deleteItems/types';
import {DeleteResourceCascadeFnDefaultArgs} from '../endpoints/types';
import {AnyObject, ObjectValues} from '../utils/types';
import {AppResourceTypeMap, Resource} from './system';

export const JobTypeMap = {
  DeleteResource: 'deleteResource',
} as const;

export const JobStatusMap = {
  Pending: 'pending',
  InProgress: 'inProgress',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type JobType = ObjectValues<typeof JobTypeMap>;
export type JobStatus = ObjectValues<typeof JobStatusMap>;

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
        | typeof AppResourceTypeMap.Workspace
        | typeof AppResourceTypeMap.AgentToken
        | typeof AppResourceTypeMap.Folder
        | typeof AppResourceTypeMap.Tag
        | typeof AppResourceTypeMap.PermissionGroup
        | typeof AppResourceTypeMap.CollaborationRequest;
      args: DeleteResourceCascadeFnDefaultArgs;
    }
  | {
      type: typeof AppResourceTypeMap.User;
      args: RemoveCollaboratorCascadeFnsArgs;
      isRemoveCollaborator: true;
    }
  | {
      type: typeof AppResourceTypeMap.File;
      args: DeleteFileCascadeDeleteFnsArgs;
    }
  | {
      type: typeof AppResourceTypeMap.PermissionItem;
      args: DeletePermissionItemsCascadeFnsArgs;
    }
  | {
      type: typeof AppResourceTypeMap.Workspace;
      args: DeletePermissionItemsCascadeFnsArgs;
    };

export const JOB_RUNNER_V1 = 1;
