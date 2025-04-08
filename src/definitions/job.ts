import {AnyFn, AnyObject, OmitFrom, PartialRecord} from 'softkave-js-utils';
import {ValueOf} from 'type-fest';
import {NewSignupsOnWaitlistEmailProps} from '../emailTemplates/newSignupsOnWaitlist.js';
import {BaseEmailTemplateProps} from '../emailTemplates/types.js';
import {FimidaraConfigEmailProvider} from '../resources/config.js';
import {AppShardId} from './app.js';
import {Agent, FimidaraResourceType, Resource} from './system.js';

export const kJobType = {
  deleteResource: 'deleteResource',
  /** TODO: separated from deleteResource because it's a bit more complex and
   * there's a job created for each input item */
  deletePermissionItem: 'deletePermissionItem',
  ingestFolderpath: 'ingestFolderpath',
  ingestMount: 'ingestMount',
  cleanupMountResolvedEntries: 'cleanupMountResolvedEntries',
  email: 'email',
  newSignupsOnWaitlist: 'newSignupsOnWaitlist',
  /** Primarily used for testing. A job that does nothing. */
  noop: 'noop',
  /** Primarily used for testing. A job that will always fail! */
  fail: 'fail',
  completeMultipartUpload: 'completeMultipartUpload',
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

export const kJobRunCategory = {
  once: 'once',
  cron: 'cron',
};

export type JobType = ValueOf<typeof kJobType>;
export type JobStatus = ValueOf<typeof kJobStatus>;
export type JobRunCategory = ValueOf<typeof kJobRunCategory>;

export interface JobStatusHistory {
  status: JobStatus;
  statusLastUpdatedAt: number;
  runnerId?: string;
  errorMessage?: string;
}

export interface RunAfterJobItem {
  jobId: string;
  status: JobStatus[];
}

export interface Job<
  TParams extends AnyObject = AnyObject,
  TMeta extends AnyObject = AnyObject,
> extends Resource {
  createdBy: Agent;
  type: JobType;
  params: TParams;
  meta?: TMeta;
  workspaceId?: string;
  status: JobStatus;
  statusLastUpdatedAt: number;
  // TODO: what other error-related fields?
  errorMessage?: string;
  minRunnerVersion: number;
  runnerId?: string;
  parentJobId?: string;
  // TODO: consider a bit packing or bloom filter-related alternative, that
  // allows for false-positives but no false-negatives
  parents: string[];
  idempotencyToken: string;
  /** Higher number carries more weight. */
  priority: number;
  /** For selectively picking jobs so runners don't run jobs that do not apply
   * to them, for example during testing. */
  shard: AppShardId;
  runAfter?: RunAfterJobItem[];
  /** Milliseconds timestamp to mark jobs already visited. Useful when the job
   * is not ready, and to prevent previous evaluator & other runners from
   * fetching until after a cooldown. */
  cooldownTill?: number;
  runCategory?: JobRunCategory;
  /** Run interval in milliseconds. */
  cronInterval?: number;
}

export type DeleteResourceCascadeFnDefaultArgs = {
  workspaceId: string;
  resourceId: string;
};

export type DeleteResourceJobParams = DeleteResourceCascadeFnDefaultArgs & {
  type: FimidaraResourceType;
  /** to separate from removing a user, which we don't support yet, but soon */
  isRemoveCollaborator?: true;
};

export type DeleteFilePartJobParams = DeleteResourceCascadeFnDefaultArgs & {
  clientMultipartId: string;
  part: number;
  internalMultipartId: string;
  internalPartId: string;
};

export interface DeleteResourceJobMeta {
  getArtifacts?: PartialRecord<string, {page: number; pageSize: number}>;
  deleteArtifacts?: PartialRecord<string, {done: boolean}>;
  preRunMeta?: AnyObject;
}

export interface IngestFolderpathJobParams {
  mountId: string;
  /** Not always the mount's `mountedFrom`, but what folder to ingest from. So,
   * for the 1st ingestion job, this will be the mount's source, but for mounts
   * that support describing folders, this can also be subsequent folder
   * children. */
  ingestFrom: string[];
}

export interface IngestFolderpathJobMeta {
  getContentContinuationToken?: unknown;
}

export interface IngestMountJobParams {
  mountId: string;
}

export interface CleanupMountResolvedEntriesJobParams {
  mountId: string;
}

export interface INewSignupsOnWaitlistJobMeta {
  lastRunMs?: number;
}

export interface CompleteMultipartUploadJobParams {
  fileId: string;
  // parts: CompleteMultipartUploadInputPart[];
  parts: string;
  requestId: string;
}

export const kEmailJobType = {
  collaborationRequest: 'collaborationRequest',
  collaborationRequestExpired: 'collaborationRequestExpired',
  collaborationRequestResponse: 'collaborationRequestResponse',
  collaborationRequestRevoked: 'collaborationRequestRevoked',
  confirmEmailAddress: 'confirmEmailAddress',
  forgotPassword: 'forgotPassword',
  upgradedFromWaitlist: 'upgradedFromWaitlist',
  newSignupsOnWaitlist: 'newSignupsOnWaitlist',
  // usageExceeded: 'usageExceeded',
} as const;

export type EmailJobType = ValueOf<typeof kEmailJobType>;

export interface CollaborationRequestEmailJobParams {
  requestId: string;
}

export type EmailJobParams = {
  emailAddress: string[];
  userId: string[];
} & (
  | {
      type: typeof kEmailJobType.collaborationRequest;
      params: CollaborationRequestEmailJobParams;
    }
  | {
      type: typeof kEmailJobType.collaborationRequestExpired;
      params: CollaborationRequestEmailJobParams;
    }
  | {
      type: typeof kEmailJobType.collaborationRequestResponse;
      params: CollaborationRequestEmailJobParams;
    }
  | {
      type: typeof kEmailJobType.collaborationRequestRevoked;
      params: CollaborationRequestEmailJobParams;
    }
  | {type: typeof kEmailJobType.confirmEmailAddress}
  | {type: typeof kEmailJobType.forgotPassword}
  | {type: typeof kEmailJobType.upgradedFromWaitlist}
  | {
      type: typeof kEmailJobType.newSignupsOnWaitlist;
      params: OmitFrom<
        NewSignupsOnWaitlistEmailProps,
        keyof BaseEmailTemplateProps | 'upgradeWaitlistURL'
      >;
    }
);
// | {
//     type: typeof kEmailJobType.usageExceeded;
//     params: UsageExceededEmailProps;
//   }

export interface EmailJobMeta {
  emailProvider: FimidaraConfigEmailProvider;
  other?: AnyObject;
}

export const kJobRunnerV1 = 1;

export const kJobIdempotencyTokens: Record<
  JobType,
  AnyFn<string[], string>
> = Object.keys(kJobType).reduce(
  (acc, type) => {
    acc[type as JobType] = (...args: string[]) => `${type}_${args.join('_')}`;
    return acc;
  },
  {} as Record<JobType, AnyFn<string[], string>>
);
