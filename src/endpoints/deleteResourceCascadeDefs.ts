import {CleanupMountResolvedEntriesJobParams, Job} from '../definitions/job';
import {AppResourceTypeMap} from '../definitions/system';
import {extractResourceIdList, noopAsync} from '../utils/fns';
import {kReuseableErrors} from '../utils/reusableErrors';
import {AnyFn} from '../utils/types';
import {RemoveCollaboratorCascadeFnsArgs} from './collaborators/removeCollaborator/types';
import {kSemanticModels, kUtilsInjectables} from './contexts/injectables';
import {SemanticProviderMutationRunOptions} from './contexts/semantic/types';
import {DeleteFileBackendConfigCascadeFnsArgs} from './fileBackends/deleteConfig/types';
import {DeleteFileCascadeDeleteFnsArgs} from './files/deleteFile/types';
import {DeleteFolderCascadeFnsArgs} from './folders/deleteFolder/types';
import {queueJobs} from './jobs/utils';
import {DeletePermissionItemsCascadeFnsArgs} from './permissionItems/deleteItems/types';
import EndpointReusableQueries from './queries';
import {DeleteResourceCascadeFnHelpers, DeleteResourceCascadeFnsMap} from './types';

export async function runDeleteResourceJob<Args>(
  cascadeDef: DeleteResourceCascadeFnsMap<Args>,
  args: Args,
  job: Job
) {
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job,
    async withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>) {
      await kSemanticModels.utils().withTxn(opts => fn(opts));
    },
  };

  await Promise.all(Object.values(cascadeDef).map(fn => fn(args, helperFns)));
}

export const kDeletePermissionItemsCascaseFns: DeleteResourceCascadeFnsMap<DeletePermissionItemsCascadeFnsArgs> =
  {
    [AppResourceTypeMap.All]: noopAsync,
    [AppResourceTypeMap.System]: noopAsync,
    [AppResourceTypeMap.Public]: noopAsync,
    [AppResourceTypeMap.Workspace]: noopAsync,
    [AppResourceTypeMap.CollaborationRequest]: noopAsync,
    [AppResourceTypeMap.AgentToken]: noopAsync,
    [AppResourceTypeMap.Folder]: noopAsync,
    [AppResourceTypeMap.File]: noopAsync,
    [AppResourceTypeMap.User]: noopAsync,
    [AppResourceTypeMap.UsageRecord]: noopAsync,
    [AppResourceTypeMap.EndpointRequest]: noopAsync,
    [AppResourceTypeMap.Job]: noopAsync,
    [AppResourceTypeMap.Tag]: noopAsync,
    [AppResourceTypeMap.PermissionGroup]: noopAsync,
    [AppResourceTypeMap.FilePresignedPath]: noopAsync,
    [AppResourceTypeMap.FileBackendMount]: noopAsync,
    [AppResourceTypeMap.FileBackendConfig]: noopAsync,
    [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
    [AppResourceTypeMap.PermissionItem]: async (args, helpers) => {
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
    [AppResourceTypeMap.AssignedItem]: async (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .assignedItem()
          .deleteWorkspaceResourceAssignedItems(
            args.workspaceId,
            args.permissionItemsIdList,
            undefined,
            opts
          )
      ),
  };

export const kDeleteAgentTokenCascadeFns: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.Workspace]: noopAsync,
  [AppResourceTypeMap.CollaborationRequest]: noopAsync,
  [AppResourceTypeMap.PermissionGroup]: noopAsync,
  [AppResourceTypeMap.Folder]: noopAsync,
  [AppResourceTypeMap.File]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.UsageRecord]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: noopAsync,
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.FileBackendMount]: noopAsync,
  [AppResourceTypeMap.FileBackendConfig]: noopAsync,
  [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
  [AppResourceTypeMap.AgentToken]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.agentToken().deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: async (args, helpers) => {
    helpers.withTxn(opts =>
      Promise.all([
        kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts),
        kSemanticModels.permissionItem().deleteManyByEntityId(args.resourceId, opts),
      ])
    );
  },
  [AppResourceTypeMap.AssignedItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        )
    ),
  [AppResourceTypeMap.FilePresignedPath]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .filePresignedPath()
        .deleteManyByQuery({agentTokenId: args.resourceId}, opts)
    ),
};

export const kDeleteCollaborationRequestsCascadeFns: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.Workspace]: noopAsync,
  [AppResourceTypeMap.PermissionGroup]: noopAsync,
  [AppResourceTypeMap.Folder]: noopAsync,
  [AppResourceTypeMap.File]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.UsageRecord]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: noopAsync,
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.AgentToken]: noopAsync,
  [AppResourceTypeMap.PermissionItem]: noopAsync,
  [AppResourceTypeMap.FilePresignedPath]: noopAsync,
  [AppResourceTypeMap.FileBackendMount]: noopAsync,
  [AppResourceTypeMap.FileBackendConfig]: noopAsync,
  [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
  [AppResourceTypeMap.CollaborationRequest]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.collaborationRequest().deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.AssignedItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        )
    ),
};

// TODO: delete client token and client token artifacts using provided resource ID
export const kRemoveCollaboratorCascadeFns: DeleteResourceCascadeFnsMap<RemoveCollaboratorCascadeFnsArgs> =
  {
    [AppResourceTypeMap.All]: noopAsync,
    [AppResourceTypeMap.System]: noopAsync,
    [AppResourceTypeMap.Public]: noopAsync,
    [AppResourceTypeMap.Workspace]: noopAsync,
    [AppResourceTypeMap.AgentToken]: noopAsync,
    [AppResourceTypeMap.PermissionGroup]: noopAsync,
    [AppResourceTypeMap.Folder]: noopAsync,
    [AppResourceTypeMap.File]: noopAsync,
    [AppResourceTypeMap.User]: noopAsync,
    [AppResourceTypeMap.UsageRecord]: noopAsync,
    [AppResourceTypeMap.EndpointRequest]: noopAsync,
    [AppResourceTypeMap.Job]: noopAsync,
    [AppResourceTypeMap.Tag]: noopAsync,
    [AppResourceTypeMap.FileBackendMount]: noopAsync,
    [AppResourceTypeMap.FileBackendConfig]: noopAsync,
    [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
    [AppResourceTypeMap.CollaborationRequest]: (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .collaborationRequest()
          .deleteManyByQuery(
            {workspaceId: args.workspaceId, recipientEmail: args.userEmail},
            opts
          )
      ),
    [AppResourceTypeMap.PermissionItem]: async (args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts),
          kSemanticModels.permissionItem().deleteManyByEntityId(args.resourceId, opts),
        ])
      ),
    [AppResourceTypeMap.AssignedItem]: (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .assignedItem()
          .deleteWorkspaceResourceAssignedItems(
            args.workspaceId,
            args.resourceId,
            undefined,
            opts
          )
      ),
    [AppResourceTypeMap.FilePresignedPath]: (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .filePresignedPath()
          .deleteManyByQuery({agentTokenId: args.agentTokenId}, opts)
      ),
  };

export const kDeleteFileCascadeFns: DeleteResourceCascadeFnsMap<DeleteFileCascadeDeleteFnsArgs> =
  {
    [AppResourceTypeMap.All]: noopAsync,
    [AppResourceTypeMap.System]: noopAsync,
    [AppResourceTypeMap.Public]: noopAsync,
    [AppResourceTypeMap.Workspace]: noopAsync,
    [AppResourceTypeMap.CollaborationRequest]: noopAsync,
    [AppResourceTypeMap.AgentToken]: noopAsync,
    [AppResourceTypeMap.PermissionGroup]: noopAsync,
    [AppResourceTypeMap.Folder]: noopAsync,
    [AppResourceTypeMap.User]: noopAsync,
    [AppResourceTypeMap.UsageRecord]: noopAsync,
    [AppResourceTypeMap.EndpointRequest]: noopAsync,
    [AppResourceTypeMap.Job]: noopAsync,
    [AppResourceTypeMap.Tag]: noopAsync,
    [AppResourceTypeMap.FileBackendMount]: noopAsync,
    [AppResourceTypeMap.FileBackendConfig]: noopAsync,
    [AppResourceTypeMap.File]: async (args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          kSemanticModels.file().deleteManyByIdList(args.fileIdList, opts),
          context.fileBackend.deleteFiles({
            bucket: kUtilsInjectables.config().S3Bucket,
            filepaths: args.fileIdList,
          }),
        ])
      ),
    [AppResourceTypeMap.PermissionItem]: (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels.permissionItem().deleteManyByTargetId(args.fileIdList, opts)
      ),
    [AppResourceTypeMap.AssignedItem]: (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .assignedItem()
          .deleteWorkspaceResourceAssignedItems(
            args.workspaceId,
            args.fileIdList,
            undefined,
            opts
          )
      ),
    [AppResourceTypeMap.FilePresignedPath]: async (args, helpers) =>
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
    [AppResourceTypeMap.ResolvedMountEntry]: (args, helpers) =>
      helpers.withTxn(async opts => {
        await kSemanticModels
          .resolvedMountEntry()
          .deleteManyByQuery({resolvedFor: {$in: args.fileIdList}}, opts);
      }),
  };

export const kDeleteFoldersCascadeFns: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.Workspace]: noopAsync,
  [AppResourceTypeMap.CollaborationRequest]: noopAsync,
  [AppResourceTypeMap.AgentToken]: noopAsync,
  [AppResourceTypeMap.PermissionGroup]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.UsageRecord]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: noopAsync,
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.FilePresignedPath]: noopAsync,
  [AppResourceTypeMap.FileBackendMount]: noopAsync,
  [AppResourceTypeMap.FileBackendConfig]: noopAsync,
  [AppResourceTypeMap.File]: async (args, helpers) => {
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
  [AppResourceTypeMap.Folder]: async (args, helpers) => {
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
  [AppResourceTypeMap.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        )
    ),
  [AppResourceTypeMap.ResolvedMountEntry]: (args, helpers) =>
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
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.Workspace]: noopAsync,
  [AppResourceTypeMap.CollaborationRequest]: noopAsync,
  [AppResourceTypeMap.AgentToken]: noopAsync,
  [AppResourceTypeMap.Folder]: noopAsync,
  [AppResourceTypeMap.File]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.UsageRecord]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: noopAsync,
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.FilePresignedPath]: noopAsync,
  [AppResourceTypeMap.FileBackendMount]: noopAsync,
  [AppResourceTypeMap.FileBackendConfig]: noopAsync,
  [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
  [AppResourceTypeMap.PermissionGroup]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionGroup().deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: async (args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts),
        kSemanticModels.permissionItem().deleteManyByEntityId(args.resourceId, opts),
      ])
    ),
  [AppResourceTypeMap.AssignedItem]: async (args, helpers) =>
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
            undefined,
            opts
          ),
      ])
    ),
};

export const kDeleteTagsCascadeFns: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.Workspace]: noopAsync,
  [AppResourceTypeMap.CollaborationRequest]: noopAsync,
  [AppResourceTypeMap.AgentToken]: noopAsync,
  [AppResourceTypeMap.PermissionGroup]: noopAsync,
  [AppResourceTypeMap.Folder]: noopAsync,
  [AppResourceTypeMap.File]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.UsageRecord]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: noopAsync,
  [AppResourceTypeMap.FilePresignedPath]: noopAsync,
  [AppResourceTypeMap.FileBackendMount]: noopAsync,
  [AppResourceTypeMap.FileBackendConfig]: noopAsync,
  [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
  [AppResourceTypeMap.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.Tag]: (args, helpers) =>
    helpers.withTxn(opts => kSemanticModels.tag().deleteOneById(args.resourceId, opts)),
  [AppResourceTypeMap.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteWorkspaceAssignedItemResources(args.workspaceId, args.resourceId, opts)
    ),
};

export const kDeleteFileBackendConfigCascadeFns: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.Workspace]: noopAsync,
  [AppResourceTypeMap.CollaborationRequest]: noopAsync,
  [AppResourceTypeMap.AgentToken]: noopAsync,
  [AppResourceTypeMap.PermissionGroup]: noopAsync,
  [AppResourceTypeMap.Folder]: noopAsync,
  [AppResourceTypeMap.File]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.UsageRecord]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: noopAsync,
  [AppResourceTypeMap.FilePresignedPath]: noopAsync,
  [AppResourceTypeMap.FileBackendMount]: noopAsync,
  [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
  [AppResourceTypeMap.FileBackendConfig]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.AssignedItem]: noopAsync,
  other: async args => {
    await kUtilsInjectables
      .secretsManager()
      .deleteSecret({secretId: (args as DeleteFileBackendConfigCascadeFnsArgs).secretId});
  },
};

export const kDeleteFileBackendMountCascadeFns: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.Workspace]: noopAsync,
  [AppResourceTypeMap.CollaborationRequest]: noopAsync,
  [AppResourceTypeMap.AgentToken]: noopAsync,
  [AppResourceTypeMap.PermissionGroup]: noopAsync,
  [AppResourceTypeMap.Folder]: noopAsync,
  [AppResourceTypeMap.File]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.UsageRecord]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: noopAsync,
  [AppResourceTypeMap.FilePresignedPath]: noopAsync,
  [AppResourceTypeMap.ResolvedMountEntry]: noopAsync,
  [AppResourceTypeMap.FileBackendMount]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.FileBackendConfig]: noopAsync,
  [AppResourceTypeMap.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.AssignedItem]: noopAsync,
  other: async (args, helpers) => {
    await queueJobs<CleanupMountResolvedEntriesJobParams>(
      args.workspaceId,
      helpers.job.resourceId,
      [{type: 'cleanupMountResolvedEntries', params: {mountId: args.resourceId}}]
    );
  },
};

export const kDeleteWorkspaceCascadeFns: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.job().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.Workspace]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.workspace().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.CollaborationRequest]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .collaborationRequest()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.AgentToken]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.agentToken().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.PermissionGroup]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionGroup().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.Folder]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.folder().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.File]: async (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .file()
        .deleteManyByQuery(
          EndpointReusableQueries.getByWorkspaceId(args.workspaceId),
          opts
        )
    ),
  [AppResourceTypeMap.Tag]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.tag().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.AssignedItem]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.assignedItem().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.UsageRecord]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.usageRecord().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.FilePresignedPath]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.filePresignedPath().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.FileBackendMount]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendMount().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.FileBackendConfig]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.ResolvedMountEntry]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.resolvedMountEntry().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
};
