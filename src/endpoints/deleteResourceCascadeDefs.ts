import {AppResourceTypeMap} from '../definitions/system';
import {extractResourceIdList, noopAsync} from '../utils/fns';
import {kReuseableErrors} from '../utils/reusableErrors';
import {RemoveCollaboratorCascadeFnsArgs} from './collaborators/removeCollaborator/types';
import {kSemanticModels} from './contexts/injectables';
import {DeleteFileCascadeDeleteFnsArgs} from './files/deleteFile/types';
import FolderQueries from './folders/queries';
import {DeletePermissionItemsCascadeFnsArgs} from './permissionItems/deleteItems/types';
import EndpointReusableQueries from './queries';
import {DeleteResourceCascadeFnsMap} from './types';
import {executeCascadeDelete} from './utils';

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
    [AppResourceTypeMap.PermissionItem]: async (context, args, helpers) => {
      await helpers.withTxn(opts =>
        Promise.all([
          context.semantic.permissionItem.deleteManyByIdList(
            args.permissionItemsIdList,
            opts
          ),
          context.semantic.permissionItem.deleteManyByTargetId(
            args.permissionItemsIdList,
            opts
          ),
        ])
      );
    },
    [AppResourceTypeMap.AssignedItem]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
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
  [AppResourceTypeMap.AgentToken]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.agentToken.deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: async (context, args, helpers) => {
    helpers.withTxn(opts =>
      Promise.all([
        context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
        context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
      ])
    );
  },
  [AppResourceTypeMap.AssignedItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
        args.workspaceId,
        args.resourceId,
        undefined,
        opts
      )
    ),
  [AppResourceTypeMap.FilePresignedPath]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.filePresignedPath.deleteManyByQuery(
        {agentTokenId: args.resourceId},
        opts
      )
    ),
};

export const DELETE_COLLABORATION_REQUEST_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
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
  [AppResourceTypeMap.CollaborationRequest]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.collaborationRequest.deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.AssignedItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
        args.workspaceId,
        args.resourceId,
        undefined,
        opts
      )
    ),
};

// TODO: delete client token and client token artifacts using provided resource ID
export const REMOVE_COLLABORATOR_CASCADE_FNS: DeleteResourceCascadeFnsMap<RemoveCollaboratorCascadeFnsArgs> =
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
    [AppResourceTypeMap.CollaborationRequest]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.collaborationRequest.deleteManyByQuery(
          {workspaceId: args.workspaceId, recipientEmail: args.userEmail},
          opts
        )
      ),
    [AppResourceTypeMap.PermissionItem]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
          context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
        ])
      ),
    [AppResourceTypeMap.AssignedItem]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        )
      ),
    [AppResourceTypeMap.FilePresignedPath]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.filePresignedPath.deleteManyByQuery(
          {agentTokenId: args.agentTokenId},
          opts
        )
      ),
  };

export const DELETE_FILE_CASCADE_FNS: DeleteResourceCascadeFnsMap<DeleteFileCascadeDeleteFnsArgs> =
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
    [AppResourceTypeMap.File]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          context.semantic.file.deleteManyByIdList(args.fileIdList, opts),
          context.fileBackend.deleteFiles({
            bucket: context.appVariables.S3Bucket,
            filepaths: args.fileIdList,
          }),
        ])
      ),
    [AppResourceTypeMap.PermissionItem]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.permissionItem.deleteManyByTargetId(args.fileIdList, opts)
      ),
    [AppResourceTypeMap.AssignedItem]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.fileIdList,
          undefined,
          opts
        )
      ),
    [AppResourceTypeMap.FilePresignedPath]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all(
          args.files.map(f =>
            context.semantic.filePresignedPath.deleteManyByQuery(
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
  };

export const DELETE_FOLDER_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
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
  [AppResourceTypeMap.File]: async (context, args, helpers) => {
    const files = await context.semantic.file.getManyByQuery(
      FolderQueries.getByAncestor(args.workspaceId, args.resourceId)
    );
    await Promise.all([
      helpers.withTxn(opts =>
        context.semantic.file.deleteManyByQuery(
          FolderQueries.getByAncestor(args.workspaceId, args.resourceId),
          opts
        )
      ),
      executeCascadeDelete(context, DELETE_FILE_CASCADE_FNS, {
        workspaceId: args.workspaceId,
        fileIdList: extractResourceIdList(files),
        files: files.map(f => ({
          namepath: f.namepath,
          extension: f.extension,
          resourceId: f.resourceId,
        })),
      }),
    ]);
  },
  [AppResourceTypeMap.Folder]: async (context, args, helpers) => {
    // TODO: cascade delete folders instead
    await helpers.withTxn(opts =>
      context.semantic.folder.deleteManyByQuery(
        FolderQueries.getByAncestor(args.workspaceId, args.resourceId),
        opts
      )
    );
  },
  [AppResourceTypeMap.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.AssignedItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
        args.workspaceId,
        args.resourceId,
        undefined,
        opts
      )
    ),
};

export const DELETE_PERMISSION_GROUP_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
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
  [AppResourceTypeMap.PermissionGroup]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionGroup.deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
        context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
      ])
    ),
  [AppResourceTypeMap.AssignedItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        context.semantic.assignedItem.deleteWorkspaceAssignedItemResources(
          args.workspaceId,
          args.resourceId,
          opts
        ),
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        ),
      ])
    ),
};

export const DELETE_TAG_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
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
  [AppResourceTypeMap.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.Tag]: (context, args, helpers) =>
    helpers.withTxn(opts => context.semantic.tag.deleteOneById(args.resourceId, opts)),
  [AppResourceTypeMap.AssignedItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteWorkspaceAssignedItemResources(
        args.workspaceId,
        args.resourceId,
        opts
      )
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
  [AppResourceTypeMap.FileBackendConfig]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.AssignedItem]: noopAsync,
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
  [AppResourceTypeMap.FileBackendMount]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
    ),
  [AppResourceTypeMap.FileBackendConfig]: noopAsync,
  [AppResourceTypeMap.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceTypeMap.Tag]: noopAsync,
  [AppResourceTypeMap.AssignedItem]: noopAsync,
  other: () => {
    throw kReuseableErrors.common.notImplemented();
  },
};

export const DELETE_WORKSPACE_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceTypeMap.All]: noopAsync,
  [AppResourceTypeMap.System]: noopAsync,
  [AppResourceTypeMap.Public]: noopAsync,
  [AppResourceTypeMap.User]: noopAsync,
  [AppResourceTypeMap.EndpointRequest]: noopAsync,
  [AppResourceTypeMap.Job]: (context, args) =>
    context.data.job.deleteManyByQuery({workspaceId: args.workspaceId}),
  [AppResourceTypeMap.Workspace]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.workspace.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.CollaborationRequest]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.collaborationRequest.deleteManyByWorkspaceId(
        args.workspaceId,
        opts
      )
    ),
  [AppResourceTypeMap.AgentToken]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.agentToken.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.PermissionGroup]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionGroup.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.Folder]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.folder.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.File]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.file.deleteManyByQuery(
        EndpointReusableQueries.getByWorkspaceId(args.workspaceId),
        opts
      )
    ),
  [AppResourceTypeMap.Tag]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.tag.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.AssignedItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.UsageRecord]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.usageRecord.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.FilePresignedPath]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.filePresignedPath.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.FileBackendMount]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendMount().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceTypeMap.FileBackendConfig]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
};
