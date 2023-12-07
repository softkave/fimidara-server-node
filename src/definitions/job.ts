import {RemoveCollaboratorCascadeFnsArgs} from '../endpoints/collaborators/removeCollaborator/types';
import {DeleteFileBackendConfigCascadeFnsArgs} from '../endpoints/fileBackends/deleteConfig/types';
import {DeleteFileCascadeDeleteFnsArgs} from '../endpoints/files/deleteFile/types';
import {DeletePermissionItemsCascadeFnsArgs} from '../endpoints/permissionItems/deleteItems/types';
import {DeleteResourceCascadeFnDefaultArgs} from '../endpoints/types';
import {AnyObject, ObjectValues} from '../utils/types';
import {AppResourceTypeMap, Resource} from './system';

export const JobTypeMap = {
  deleteResource: 'deleteResource',
  ingestFolderpath: 'ingestFolderpath',
  ingestMount: 'ingestMount',
} as const;

export const JobStatusMap = {
  pending: 'pending',
  inProgress: 'inProgress',
  waitingForChildren: 'waitingForChildren',
  completed: 'completed',
  failed: 'failed',
} as const;

export type JobType = ObjectValues<typeof JobTypeMap>;
export type JobStatus = ObjectValues<typeof JobStatusMap>;

export interface Job<TParams extends AnyObject = AnyObject> extends Resource {
  type: JobType | (string & {});
  params: TParams;
  workspaceId?: string;
  status: JobStatus;
  statusDate: number;
  version: number;
  serverInstanceId: string;
  parentJobId?: string;
  idempotencyToken: string;

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
        | typeof AppResourceTypeMap.CollaborationRequest
        | typeof AppResourceTypeMap.FileBackendMount;
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
      type: typeof AppResourceTypeMap.FileBackendConfig;
      args: DeleteFileBackendConfigCascadeFnsArgs;
    };

export interface IngestFolderpathJobParams {
  mountId: string;
  folderpath: string;
  agentId: string;
}

export interface IngestMountJobParams {
  mountId: string;
  agentId: string;
}

export const kJobRunnerV1 = 1;
