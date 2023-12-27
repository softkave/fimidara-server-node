import {
  CleanupMountResolvedEntriesJobParams,
  DeleteResourceJobParams,
  Job,
} from '../../../definitions/job';
import {AppResourceType, kAppResourceType} from '../../../definitions/system';
import {extractResourceIdList, noopAsync} from '../../../utils/fns';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {AnyFn} from '../../../utils/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {FolderQueries} from '../../folders/queries';
import {DeletePermissionItemsCascadeFnsArgs} from '../../permissionItems/deleteItems/types';
import EndpointReusableQueries from '../../queries';
import {DeleteResourceCascadeFnHelpers, DeleteResourceCascadeFnsMap} from '../../types';
import {queueJobs} from '../utils';

export const kDeletePermissionItemsCascaseFns: DeleteResourceCascadeFnsMap<DeletePermissionItemsCascadeFnsArgs> =
  {
    [kAppResourceType.All]: noopAsync,
    [kAppResourceType.System]: noopAsync,
    [kAppResourceType.Public]: noopAsync,
    [kAppResourceType.Workspace]: noopAsync,
    [kAppResourceType.CollaborationRequest]: noopAsync,
    [kAppResourceType.AgentToken]: noopAsync,
    [kAppResourceType.Folder]: noopAsync,
    [kAppResourceType.File]: noopAsync,
    [kAppResourceType.User]: noopAsync,
    [kAppResourceType.UsageRecord]: noopAsync,
    [kAppResourceType.EndpointRequest]: noopAsync,
    [kAppResourceType.Job]: noopAsync,
    [kAppResourceType.Tag]: noopAsync,
    [kAppResourceType.PermissionGroup]: noopAsync,
    [kAppResourceType.FilePresignedPath]: noopAsync,
    [kAppResourceType.FileBackendMount]: noopAsync,
    [kAppResourceType.FileBackendConfig]: noopAsync,
    [kAppResourceType.ResolvedMountEntry]: noopAsync,
    [kAppResourceType.App]: noopAsync,
    [kAppResourceType.PermissionItem]: async (args, helpers) => {
      await helpers.withTxn(opts =>
        Promise.all([
          kSemanticModels
            .permissionItem()
            .deleteManyByIdList(args.permissionItemsIdList, opts),
          kSemanticModels
            .permissionItem()
            .deleteManyByTargetId(args.permissionItemsIdList, opts),
        ])
      );
    },
    [kAppResourceType.AssignedItem]: async (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .assignedItem()
          .deleteWorkspaceResourceAssignedItems(
            args.workspaceId,
            args.permissionItemsIdList,
            /** assignedItemType */ undefined,
            opts
          )
      ),
  };

export const kDeleteAgentTokenCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.CollaborationRequest]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.File]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.FileBackendMount]: noopAsync,
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.ResolvedMountEntry]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.AgentToken]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.agentToken().deleteOneById(args.resourceId, opts)
    ),
  [kAppResourceType.PermissionItem]: async (args, helpers) => {
    helpers.withTxn(opts =>
      Promise.all([
        kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts),
        kSemanticModels.permissionItem().deleteManyByEntityId(args.resourceId, opts),
      ])
    );
  },
  [kAppResourceType.AssignedItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          /** assignedItemType */ undefined,
          opts
        )
    ),
  [kAppResourceType.FilePresignedPath]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .filePresignedPath()
        .deleteManyByQuery({issueAgentTokenId: args.resourceId}, opts)
    ),
};

export const kDeleteCollaborationRequestsCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.File]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.PermissionItem]: noopAsync,
  [kAppResourceType.FilePresignedPath]: noopAsync,
  [kAppResourceType.FileBackendMount]: noopAsync,
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.ResolvedMountEntry]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.CollaborationRequest]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.collaborationRequest().deleteOneById(args.resourceId, opts)
    ),
  [kAppResourceType.AssignedItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          /** assignedItemType */ undefined,
          opts
        )
    ),
};

// TODO: delete client token and client token artifacts using provided resource ID
export const kRemoveCollaboratorCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.File]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.FileBackendMount]: noopAsync,
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.ResolvedMountEntry]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.CollaborationRequest]: (args, helpers) =>
    helpers.withTxn(async opts => {
      const user = await kSemanticModels.user().getOneById(args.resourceId);

      if (user) {
        await kSemanticModels
          .collaborationRequest()
          .deleteManyByQuery(
            {workspaceId: args.workspaceId, recipientEmail: user.email},
            opts
          );
      }
    }),
  [kAppResourceType.PermissionItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts),
        kSemanticModels.permissionItem().deleteManyByEntityId(args.resourceId, opts),
      ])
    ),
  [kAppResourceType.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          /** assignedItemType */ undefined,
          opts
        )
    ),
  [kAppResourceType.FilePresignedPath]: async (args, helpers) => {
    await helpers.withTxn(async opts => {
      const user = await kSemanticModels.user().getOneById(args.resourceId);
      await kSemanticModels
        .filePresignedPath()
        .deleteManyByQuery({issueAgentTokenId: args.agentTokenId}, opts);
    });
  },
};

export const kDeleteFileCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.CollaborationRequest]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.FileBackendMount]: (args, helpers) =>
    helpers.withTxn(opts => {
      kSemanticModels.fileBackendMount().deleteManyByQuery({}, opts);
    }),
  [kAppResourceType.File]: async (args, helpers) => {
    helpers.withTxn(opts => {
      Promise.all([
        kSemanticModels.file().deleteManyByIdList(args.fileIdList, opts),
        context.fileBackend.deleteFiles({
          bucket: kUtilsInjectables.config().S3Bucket,
          filepaths: args.fileIdList,
        }),
      ]);
    });
  },
  [kAppResourceType.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.fileIdList, opts)
    ),
  [kAppResourceType.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.fileIdList,
          /** assignedItemType */ undefined,
          opts
        )
    ),
  [kAppResourceType.FilePresignedPath]: async (args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all(
        args.files.map(f =>
          kSemanticModels.filePresignedPath().deleteManyByQuery(
            {
              filepath: {$all: f.namepath, $size: f.namepath.length},
              extension: f.extension,
              workspaceId: args.workspaceId,
            },
            opts
          )
        )
      )
    ),
  [kAppResourceType.ResolvedMountEntry]: (args, helpers) =>
    helpers.withTxn(async opts => {
      await kSemanticModels
        .resolvedMountEntry()
        .deleteManyByQuery({resolvedFor: {$in: args.fileIdList}}, opts);
    }),
};

export const kDeleteFoldersCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.CollaborationRequest]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.FilePresignedPath]: noopAsync,
  [kAppResourceType.FileBackendMount]: noopAsync,
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.File]: async (args, helpers) => {
    // TODO: very inefficient
    throw kReuseableErrors.common.notImplemented();
    const files = await kSemanticModels
      .file()
      .getManyByQuery(FolderQueries.getByAncestor(args.workspaceId, args.resourceId));
    await Promise.all([
      helpers.withTxn(opts =>
        kSemanticModels
          .file()
          .deleteManyByQuery(
            FolderQueries.getByAncestor(args.workspaceId, args.resourceId),
            opts
          )
      ),
      runDeleteResourceJob(
        kDeleteFileCascadeFns,
        {
          workspaceId: args.workspaceId,
          fileIdList: extractResourceIdList(files),
          files: files.map(f => ({
            namepath: f.namepath,
            extension: f.extension,
            resourceId: f.resourceId,
          })),
        },
        helpers.job
      ),
    ]);
  },
  [kAppResourceType.Folder]: async (args, helpers) => {
    // TODO: cascade delete folders instead
    await helpers.withTxn(opts =>
      kSemanticModels
        .folder()
        .deleteManyByQuery(
          FolderQueries.getByAncestor(args.workspaceId, args.resourceId),
          opts
        )
    );
  },
  [kAppResourceType.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [kAppResourceType.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          /** assignedItemType */ undefined,
          opts
        )
    ),
  [kAppResourceType.ResolvedMountEntry]: (args, helpers) =>
    helpers.withTxn(async opts => {
      const cleanupArgs = args as DeleteFolderCascadeFnsArgs;
      await kSemanticModels.resolvedMountEntry().deleteManyByQuery(
        {
          workspaceId: args.workspaceId,
          namepath: {$all: cleanupArgs.folder.namepath},
        },
        opts
      );
    }),
};

export const kDeletePermissionGroupsCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.CollaborationRequest]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.File]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.FilePresignedPath]: noopAsync,
  [kAppResourceType.FileBackendMount]: noopAsync,
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.ResolvedMountEntry]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.PermissionGroup]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionGroup().deleteOneById(args.resourceId, opts)
    ),
  [kAppResourceType.PermissionItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts),
        kSemanticModels.permissionItem().deleteManyByEntityId(args.resourceId, opts),
      ])
    ),
  [kAppResourceType.AssignedItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        kSemanticModels
          .assignedItem()
          .deleteWorkspaceAssignedItemResources(args.workspaceId, args.resourceId, opts),
        kSemanticModels
          .assignedItem()
          .deleteWorkspaceResourceAssignedItems(
            args.workspaceId,
            args.resourceId,
            /** assignedItemType */ undefined,
            opts
          ),
      ])
    ),
};

export const kDeleteTagsCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.CollaborationRequest]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.File]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.FilePresignedPath]: noopAsync,
  [kAppResourceType.FileBackendMount]: noopAsync,
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.ResolvedMountEntry]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [kAppResourceType.Tag]: (args, helpers) =>
    helpers.withTxn(opts => kSemanticModels.tag().deleteOneById(args.resourceId, opts)),
  [kAppResourceType.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceAssignedItemResources(args.workspaceId, args.resourceId, opts)
    ),
};

export const kDeleteFileBackendConfigCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.CollaborationRequest]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.File]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.FilePresignedPath]: noopAsync,
  [kAppResourceType.FileBackendMount]: noopAsync,
  [kAppResourceType.ResolvedMountEntry]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.FileBackendConfig]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
    ),
  [kAppResourceType.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.AssignedItem]: noopAsync,
  other: async args => {
    await kUtilsInjectables
      .secretsManager()
      .deleteSecret({secretId: (args as DeleteFileBackendConfigCascadeFnsArgs).secretId});
  },
};

export const kDeleteFileBackendMountCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.Workspace]: noopAsync,
  [kAppResourceType.CollaborationRequest]: noopAsync,
  [kAppResourceType.AgentToken]: noopAsync,
  [kAppResourceType.PermissionGroup]: noopAsync,
  [kAppResourceType.Folder]: noopAsync,
  [kAppResourceType.File]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.UsageRecord]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.Job]: noopAsync,
  [kAppResourceType.FilePresignedPath]: noopAsync,
  [kAppResourceType.ResolvedMountEntry]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.FileBackendMount]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
    ),
  [kAppResourceType.FileBackendConfig]: noopAsync,
  [kAppResourceType.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [kAppResourceType.Tag]: noopAsync,
  [kAppResourceType.AssignedItem]: noopAsync,
  other: async (args, helpers) => {
    await queueJobs<CleanupMountResolvedEntriesJobParams>(
      args.workspaceId,
      helpers.job.resourceId,
      [{type: 'cleanupMountResolvedEntries', params: {mountId: args.resourceId}}]
    );
  },
};

export const kDeleteWorkspaceCascadeFns: DeleteResourceCascadeFnsMap = {
  [kAppResourceType.All]: noopAsync,
  [kAppResourceType.System]: noopAsync,
  [kAppResourceType.Public]: noopAsync,
  [kAppResourceType.User]: noopAsync,
  [kAppResourceType.EndpointRequest]: noopAsync,
  [kAppResourceType.App]: noopAsync,
  [kAppResourceType.Job]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.job().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.Workspace]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.workspace().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.CollaborationRequest]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .collaborationRequest()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.AgentToken]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.agentToken().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.PermissionGroup]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionGroup().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.Folder]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.folder().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.File]: async (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .file()
        .deleteManyByQuery(
          EndpointReusableQueries.getByWorkspaceId(args.workspaceId),
          opts
        )
    ),
  [kAppResourceType.Tag]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.tag().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.assignedItem().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.UsageRecord]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.usageRecord().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.FilePresignedPath]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.filePresignedPath().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.FileBackendMount]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendMount().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.FileBackendConfig]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.ResolvedMountEntry]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.resolvedMountEntry().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
};

const kCascadeDeleteDefs: Record<
  AppResourceType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DeleteResourceCascadeFnsMap<any> | undefined
> = {
  [kAppResourceType.All]: undefined,
  [kAppResourceType.System]: undefined,
  [kAppResourceType.Public]: undefined,
  [kAppResourceType.UsageRecord]: undefined,
  [kAppResourceType.EndpointRequest]: undefined,
  [kAppResourceType.AssignedItem]: undefined,
  [kAppResourceType.Job]: undefined,
  [kAppResourceType.FilePresignedPath]: undefined,
  [kAppResourceType.ResolvedMountEntry]: undefined,
  [kAppResourceType.App]: undefined,

  // TODO: will need update when we implement deleting users
  [kAppResourceType.User]: kRemoveCollaboratorCascadeFns,
  [kAppResourceType.CollaborationRequest]: kDeleteCollaborationRequestsCascadeFns,
  [kAppResourceType.Workspace]: kDeleteWorkspaceCascadeFns,
  [kAppResourceType.AgentToken]: kDeleteAgentTokenCascadeFns,
  [kAppResourceType.Folder]: kDeleteFoldersCascadeFns,
  [kAppResourceType.File]: kDeleteFileCascadeFns,
  [kAppResourceType.Tag]: kDeleteTagsCascadeFns,
  [kAppResourceType.PermissionGroup]: kDeletePermissionGroupsCascadeFns,
  [kAppResourceType.PermissionItem]: kDeletePermissionItemsCascaseFns,
  [kAppResourceType.FileBackendConfig]: kDeleteFileBackendConfigCascadeFns,
  [kAppResourceType.FileBackendMount]: kDeleteFileBackendMountCascadeFns,
};

export async function runDeleteResourceJob(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const cascadeDef = kCascadeDeleteDefs[params.type];

  if (cascadeDef) {
    const helperFns: DeleteResourceCascadeFnHelpers = {
      job,
      async withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>) {
        await kSemanticModels.utils().withTxn(opts => fn(opts));
      },
    };

    await Promise.all(Object.values(cascadeDef).map(fn => fn(params.args, helperFns)));
  }
}
