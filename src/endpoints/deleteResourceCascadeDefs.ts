import {AppResourceType} from '../definitions/system';
import {extractResourceIdList, noopAsync} from '../utils/fns';
import {RemoveCollaboratorCascadeFnsArgs} from './collaborators/removeCollaborator/types';
import {DeleteFileCascadeDeleteFnsArgs} from './files/deleteFile/types';
import FolderQueries from './folders/queries';
import {DeletePermissionItemsCascadeFnsArgs} from './permissionItems/deleteItems/types';
import EndpointReusableQueries from './queries';
import {DeleteResourceCascadeFnsMap} from './types';
import {executeCascadeDelete} from './utils';

export const DELETE_PERMISSION_ITEMS_CASCADE_FNS: DeleteResourceCascadeFnsMap<DeletePermissionItemsCascadeFnsArgs> =
  {
    [AppResourceType.All]: noopAsync,
    [AppResourceType.System]: noopAsync,
    [AppResourceType.Public]: noopAsync,
    [AppResourceType.Workspace]: noopAsync,
    [AppResourceType.CollaborationRequest]: noopAsync,
    [AppResourceType.AgentToken]: noopAsync,
    [AppResourceType.Folder]: noopAsync,
    [AppResourceType.File]: noopAsync,
    [AppResourceType.User]: noopAsync,
    [AppResourceType.UsageRecord]: noopAsync,
    [AppResourceType.EndpointRequest]: noopAsync,
    [AppResourceType.Job]: noopAsync,
    [AppResourceType.Tag]: noopAsync,
    [AppResourceType.PermissionGroup]: noopAsync,
    [AppResourceType.FilePresignedPath]: noopAsync,
    [AppResourceType.PermissionItem]: async (context, args, helpers) => {
      await helpers.withTxn(opts =>
        Promise.all([
          context.semantic.permissionItem.deleteManyByIdList(args.permissionItemsIdList, opts),
          context.semantic.permissionItem.deleteManyByTargetId(args.permissionItemsIdList, opts),
        ])
      );
    },
    [AppResourceType.AssignedItem]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.permissionItemsIdList,
          undefined,
          opts
        )
      ),
  };

export const DELETE_AGENT_TOKEN_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.AgentToken]: (context, args, helpers) =>
    helpers.withTxn(opts => context.semantic.agentToken.deleteOneById(args.resourceId, opts)),
  [AppResourceType.PermissionItem]: async (context, args, helpers) => {
    helpers.withTxn(opts =>
      Promise.all([
        context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
        context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
      ])
    );
  },
  [AppResourceType.AssignedItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
        args.workspaceId,
        args.resourceId,
        undefined,
        opts
      )
    ),
  [AppResourceType.FilePresignedPath]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.filePresignedPath.deleteManyByQuery({agentTokenId: args.resourceId}, opts)
    ),
};

export const DELETE_COLLABORATION_REQUEST_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.PermissionItem]: noopAsync,
  [AppResourceType.FilePresignedPath]: noopAsync,
  [AppResourceType.CollaborationRequest]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.collaborationRequest.deleteOneById(args.resourceId, opts)
    ),
  [AppResourceType.AssignedItem]: async (context, args, helpers) =>
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
    [AppResourceType.All]: noopAsync,
    [AppResourceType.System]: noopAsync,
    [AppResourceType.Public]: noopAsync,
    [AppResourceType.Workspace]: noopAsync,
    [AppResourceType.AgentToken]: noopAsync,
    [AppResourceType.PermissionGroup]: noopAsync,
    [AppResourceType.Folder]: noopAsync,
    [AppResourceType.File]: noopAsync,
    [AppResourceType.User]: noopAsync,
    [AppResourceType.UsageRecord]: noopAsync,
    [AppResourceType.EndpointRequest]: noopAsync,
    [AppResourceType.Job]: noopAsync,
    [AppResourceType.Tag]: noopAsync,
    [AppResourceType.CollaborationRequest]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.collaborationRequest.deleteManyByQuery(
          {workspaceId: args.workspaceId, recipientEmail: args.userEmail},
          opts
        )
      ),
    [AppResourceType.PermissionItem]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
          context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
        ])
      ),
    [AppResourceType.AssignedItem]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        )
      ),
    [AppResourceType.FilePresignedPath]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.filePresignedPath.deleteManyByQuery(
          {agentTokenId: args.agentTokenId},
          opts
        )
      ),
  };

export const DELETE_FILE_CASCADE_FNS: DeleteResourceCascadeFnsMap<DeleteFileCascadeDeleteFnsArgs> =
  {
    [AppResourceType.All]: noopAsync,
    [AppResourceType.System]: noopAsync,
    [AppResourceType.Public]: noopAsync,
    [AppResourceType.Workspace]: noopAsync,
    [AppResourceType.CollaborationRequest]: noopAsync,
    [AppResourceType.AgentToken]: noopAsync,
    [AppResourceType.PermissionGroup]: noopAsync,
    [AppResourceType.Folder]: noopAsync,
    [AppResourceType.User]: noopAsync,
    [AppResourceType.UsageRecord]: noopAsync,
    [AppResourceType.EndpointRequest]: noopAsync,
    [AppResourceType.Job]: noopAsync,
    [AppResourceType.Tag]: noopAsync,
    [AppResourceType.File]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          context.semantic.file.deleteManyByIdList(args.fileIdList, opts),
          context.fileBackend.deleteFiles({
            bucket: context.appVariables.S3Bucket,
            keys: args.fileIdList,
          }),
        ])
      ),
    [AppResourceType.PermissionItem]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.permissionItem.deleteManyByTargetId(args.fileIdList, opts)
      ),
    [AppResourceType.AssignedItem]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.fileIdList,
          undefined,
          opts
        )
      ),
    [AppResourceType.FilePresignedPath]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all(
          args.files.map(f =>
            context.semantic.filePresignedPath.deleteManyByQuery(
              {
                fileNamePath: {$eq: f.namePath},
                fileExtension: f.extension,
                workspaceId: args.workspaceId,
              },
              opts
            )
          )
        )
      ),
  };

export const DELETE_FOLDER_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.FilePresignedPath]: noopAsync,
  [AppResourceType.File]: async (context, args, helpers) => {
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
          namePath: f.namePath,
          extension: f.extension,
          resourceId: f.resourceId,
        })),
      }),
    ]);
  },
  [AppResourceType.Folder]: async (context, args, helpers) => {
    // TODO: cascade delete folders instead
    await helpers.withTxn(opts =>
      context.semantic.folder.deleteManyByQuery(
        FolderQueries.getByAncestor(args.workspaceId, args.resourceId),
        opts
      )
    );
  },
  [AppResourceType.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceType.AssignedItem]: (context, args, helpers) =>
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
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.FilePresignedPath]: noopAsync,
  [AppResourceType.PermissionGroup]: (context, args, helpers) =>
    helpers.withTxn(opts => context.semantic.permissionGroup.deleteOneById(args.resourceId, opts)),
  [AppResourceType.PermissionItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
        context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
      ])
    ),
  [AppResourceType.AssignedItem]: async (context, args, helpers) =>
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
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.FilePresignedPath]: noopAsync,
  [AppResourceType.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts)
    ),
  [AppResourceType.Tag]: (context, args, helpers) =>
    helpers.withTxn(opts => context.semantic.tag.deleteOneById(args.resourceId, opts)),
  [AppResourceType.AssignedItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteWorkspaceAssignedItemResources(
        args.workspaceId,
        args.resourceId,
        opts
      )
    ),
};

export const DELETE_WORKSPACE_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: (context, args) =>
    context.data.job.deleteManyByQuery({workspaceId: args.workspaceId}),
  [AppResourceType.Workspace]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.workspace.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.CollaborationRequest]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.collaborationRequest.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.AgentToken]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.agentToken.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.PermissionGroup]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionGroup.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.PermissionItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.permissionItem.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.Folder]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.folder.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.File]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.file.deleteManyByQuery(
        EndpointReusableQueries.getByWorkspaceId(args.workspaceId),
        opts
      )
    ),
  [AppResourceType.Tag]: (context, args, helpers) =>
    helpers.withTxn(opts => context.semantic.tag.deleteManyByWorkspaceId(args.workspaceId, opts)),
  [AppResourceType.AssignedItem]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.UsageRecord]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.usageRecord.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [AppResourceType.FilePresignedPath]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.filePresignedPath.deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
};
