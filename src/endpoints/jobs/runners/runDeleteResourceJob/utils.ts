import {flatten, noop} from 'lodash-es';
import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {overArgsAsync} from '../../../../utils/fns.js';
import {DeleteArtifactsFn, GetArtifactsFn} from './types.js';

export const deleteResourceAssignedItems: DeleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kIjxSemantic
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
    kIjxSemantic
      .assignedItem()
      .deleteByAssignee(args.workspaceId, args.resourceId, opts)
  );

export const deletePermissionItemsTargetingResource: DeleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kIjxSemantic
      .permissionItem()
      .deleteManyByTargetId(args.workspaceId, args.resourceId, opts)
  );

export const deleteEntityPermissionItems: DeleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kIjxSemantic
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
  kIjxSemantic
    .assignedItem()
    .getByAssignee(
      args.workspaceId,
      args.resourceId,
      /** assignedItemType */ undefined,
      opts
    );

export const getResourceAssigneeItems: GetArtifactsFn = ({args, opts}) =>
  kIjxSemantic
    .assignedItem()
    .getByAssigned(args.workspaceId, args.resourceId, opts);

export const getPermissionItemsTargetingResource: GetArtifactsFn = ({
  args,
  opts,
}) =>
  kIjxSemantic
    .permissionItem()
    .getManyByTargetId(args.workspaceId, args.resourceId, opts);

export const getEntityPermissionItems: GetArtifactsFn = ({args, opts}) =>
  kIjxSemantic
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
