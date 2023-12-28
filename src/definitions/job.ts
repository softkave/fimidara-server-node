import {DeleteResourceCascadeFnDefaultArgs} from '../endpoints/jobs/runners/runDeleteResourceJob/types';
import {AnyObject, ObjectValues} from '../utils/types';
import {AppShard} from './app';
import {AppResourceType, Resource, kAppResourceType} from './system';

export const kJobType = {
  deleteResource: 'deleteResource',
  ingestFolderpath: 'ingestFolderpath',
  ingestMount: 'ingestMount',
  cleanupMountResolvedEntries: 'cleanupMountResolvedEntries',
  /** Primarily used for testing. A job that does nothing. */
  noop: 'noop',
  /** Primarily used for testing. A job that will always fail! */
  fail: 'fail',
} as const;

export const kJobStatus = {
  pending: 'pending',
  inProgress: 'inProgress',
  waitingForChildren: 'waitingForChildren',
  completed: 'completed',
  failed: 'failed',
} as const;

export const kJobPresetPriority = {
  p1: 1,
  p2: 2,
  p3: 3,
  p4: 4,
  p5: 5,
};

export type JobType = ObjectValues<typeof kJobType>;
export type JobStatus = ObjectValues<typeof kJobStatus>;

export interface JobStatusHistory {
  status: JobStatus;
  statusLastUpdatedAt: number;
  runnerId?: string;
}

export interface Job<
  TParams extends AnyObject = AnyObject,
  TMeta extends AnyObject = AnyObject,
> extends Resource {
  type: JobType | (string & {});
  params: TParams;
  meta?: TMeta;
  workspaceId?: string;
  status: JobStatus;
  statusLastUpdatedAt: number;
  minRunnerVersion: number;
  runnerId?: string;
  parentJobId?: string;
  // TODO: consider a bit packing or bloom filter-related alternative, that
  // allows for false-positives but no false-negatives
  parents: string[];
  idempotencyToken: string;
  statusHistory: JobStatusHistory[];
  /** Higher number carries more weight. */
  priority: number;
  /** For selectively picking jobs so runners don't run jobs that do not apply
   * to them, for example during testing. */
  shard: AppShard;
}

export type DeleteResourceJobParams =
  | {
      type: Exclude<AppResourceType, typeof kAppResourceType.User>;
      args: DeleteResourceCascadeFnDefaultArgs;
    }
  | {
      type: typeof kAppResourceType.User;
      args: DeleteResourceCascadeFnDefaultArgs;
      isRemoveCollaborator: true;
    };

// export interface DeleteResourceJobMeta {
//   processedComplexArtifacts: Partial<
//     Record<AppResourceType, {page?: number; pageSize?: number; done?: boolean}>
//   >;
// }

export interface IngestFolderpathJobParams {
  mountId: string;
  agentId: string;
  /** Not always the mount's mountedFrom, but what folder to ingest from. So,
   * for the 1st ingestion job, this will be the mount's source, but for mounts
   * that support describing folders, this can also be subsequent folder
   * children. */
  ingestFrom: string;
}

export interface IngestFolderpathJobMeta {
  getFilesContinuationToken?: unknown;
  getFoldersContinuationToken?: unknown;
}

export interface IngestMountJobParams {
  mountId: string;
  agentId: string;
}

export interface CleanupMountResolvedEntriesJobParams {
  mountId: string;
}

export const kJobRunnerV1 = 1;
