import {flatten, noop} from 'lodash';
import {overArgsAsync} from '../../../../utils/fns';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {DeleteSimpleArtifactsFn, GetComplexArtifactsFn} from './types';

export const deleteResourceAssignedItems: DeleteSimpleArtifactsFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .assignedItem()
      .deleteResourceAssignedItems(
        args.workspaceId,
        args.resourceId,
        /** assignedItemType */ undefined,
        opts
      )
  );

export const deleteResourceAssigneeItems: DeleteSimpleArtifactsFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .assignedItem()
      .deleteResourceAssigneeItems(args.workspaceId, args.resourceId, opts)
  );

export const deletePermissionItemsTargetingResource: DeleteSimpleArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
  );

export const deleteEntityPermissionItems: DeleteSimpleArtifactsFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.permissionItem().deleteManyByEntityId(args.resourceId, opts)
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

export const getResourceAssignedItems: GetComplexArtifactsFn = ({args, opts}) =>
  kSemanticModels
    .assignedItem()
    .getResourceAssignedItems(
      args.workspaceId,
      args.resourceId,
      /** assignedItemType */ undefined,
      opts
    );

export const getResourceAssigneeItems: GetComplexArtifactsFn = ({args, opts}) =>
  kSemanticModels
    .assignedItem()
    .getResourceAssigneeItems(args.workspaceId, args.resourceId, opts);

export const getPermissionItemsTargetingResource: GetComplexArtifactsFn = ({
  args,
  opts,
}) => kSemanticModels.permissionItem().getManyByTargetId(args.resourceId, opts);

export const getEntityPermissionItems: GetComplexArtifactsFn = ({args, opts}) =>
  kSemanticModels.permissionItem().getManyByEntityId(args.resourceId, opts);

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
