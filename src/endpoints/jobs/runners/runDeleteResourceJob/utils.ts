import {flatten, noop} from 'lodash-es';
import {kSemanticModels} from '../../../../contexts/injection/injectables.js';
import {overArgsAsync} from '../../../../utils/fns.js';
import {DeleteArtifactsFn, GetArtifactsFn} from './types.js';

export const deleteResourceAssignedItems: DeleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .assignedItem()
      .deleteByAssigned(
        args.workspaceId,
        args.resourceId,
        /** assignedItemType */ undefined,
        opts
      )
  );

export const deleteResourceAssigneeItems: DeleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .assignedItem()
      .deleteByAssignee(args.workspaceId, args.resourceId, opts)
  );

export const deletePermissionItemsTargetingResource: DeleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .permissionItem()
      .deleteManyByTargetId(args.workspaceId, args.resourceId, opts)
  );

export const deleteEntityPermissionItems: DeleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .permissionItem()
      .deleteManyByEntityId(args.workspaceId, args.resourceId, opts)
  );

export const deleteResourceAssignedItemArtifacts = overArgsAsync(
  [deleteResourceAssignedItems, deleteResourceAssigneeItems],
  /** usePromiseSettled */ false,
  noop
);

export const deleteResourcePermissionItemArtifacts = overArgsAsync(
  [deletePermissionItemsTargetingResource, deleteEntityPermissionItems],
  /** usePromiseSettled */ false,
  noop
);

export const getResourceAssignedItems: GetArtifactsFn = ({args, opts}) =>
  kSemanticModels
    .assignedItem()
    .getByAssignee(
      args.workspaceId,
      args.resourceId,
      /** assignedItemType */ undefined,
      opts
    );

export const getResourceAssigneeItems: GetArtifactsFn = ({args, opts}) =>
  kSemanticModels
    .assignedItem()
    .getByAssigned(args.workspaceId, args.resourceId, opts);

export const getPermissionItemsTargetingResource: GetArtifactsFn = ({
  args,
  opts,
}) =>
  kSemanticModels
    .permissionItem()
    .getManyByTargetId(args.workspaceId, args.resourceId, opts);

export const getEntityPermissionItems: GetArtifactsFn = ({args, opts}) =>
  kSemanticModels
    .permissionItem()
    .getManyByEntityId(args.workspaceId, args.resourceId, opts);

export const getResourceAssignedItemArtifacts = overArgsAsync(
  [getResourceAssignedItems, getResourceAssigneeItems],
  /** usePromiseSettled */ false,
  result => flatten(result.map(next => next || []))
);

export const getResourcePermissionItemArtifacts = overArgsAsync(
  [getPermissionItemsTargetingResource, getEntityPermissionItems],
  /** usePromiseSettled */ false,
  result => flatten(result.map(next => next || []))
);
