import {CleanupMountResolvedEntriesJobParams} from '../definitions/job';
import {kAppResourceType} from '../definitions/system';
import {extractResourceIdList, noopAsync} from '../utils/fns';
import {kReuseableErrors} from '../utils/reusableErrors';
import {RemoveCollaboratorCascadeFnsArgs} from './collaborators/removeCollaborator/types';
import {kSemanticModels, kUtilsInjectables} from './contexts/injectables';
import {DeleteFileBackendConfigCascadeFnsArgs} from './fileBackends/deleteConfig/types';
import {DeleteFileCascadeDeleteFnsArgs} from './files/deleteFile/types';
import {DeleteFolderCascadeFnsArgs} from './folders/deleteFolder/types';
import {queueJobs} from './jobs/utils';
import {DeletePermissionItemsCascadeFnsArgs} from './permissionItems/deleteItems/types';
import EndpointReusableQueries from './queries';
import {DeleteResourceCascadeFnsMap} from './types';

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
            undefined,
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
          undefined,
          opts
        )
    ),
  [kAppResourceType.FilePresignedPath]: (args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .filePresignedPath()
        .deleteManyByQuery({agentTokenId: args.resourceId}, opts)
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
          undefined,
          opts
        )
    ),
};

// TODO: delete client token and client token artifacts using provided resource ID
export const kRemoveCollaboratorCascadeFns: DeleteResourceCascadeFnsMap<RemoveCollaboratorCascadeFnsArgs> =
  {
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
    [kAppResourceType.CollaborationRequest]: (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .collaborationRequest()
          .deleteManyByQuery(
            {workspaceId: args.workspaceId, recipientEmail: args.userEmail},
            opts
          )
      ),
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
            undefined,
            opts
          )
      ),
    [kAppResourceType.FilePresignedPath]: (args, helpers) =>
      helpers.withTxn(opts =>
        kSemanticModels
          .filePresignedPath()
          .deleteManyByQuery({agentTokenId: args.agentTokenId}, opts)
      ),
  };

export const kDeleteFileCascadeFns: DeleteResourceCascadeFnsMap<DeleteFileCascadeDeleteFnsArgs> =
  {
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
    [kAppResourceType.FileBackendMount]: noopAsync,
    [kAppResourceType.FileBackendConfig]: noopAsync,
    [kAppResourceType.File]: async (args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          kSemanticModels.file().deleteManyByIdList(args.fileIdList, opts),
          context.fileBackend.deleteFiles({
            bucket: kUtilsInjectables.config().S3Bucket,
            filepaths: args.fileIdList,
          }),
        ])
      ),
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
            undefined,
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
          undefined,
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
            undefined,
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
