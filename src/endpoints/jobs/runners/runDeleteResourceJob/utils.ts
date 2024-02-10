import {flatten, noop} from 'lodash';
import {overArgsAsync} from '../../../../utils/fns';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {deleteArtifactsFn, getArtifactsFn} from './types';

export const deleteResourceAssignedItems: deleteArtifactsFn = ({args, helpers}) =>
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

export const deleteResourceAssigneeItems: deleteArtifactsFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .assignedItem()
      .deleteResourceAssigneeItems(args.workspaceId, args.resourceId, opts)
  );

export const deletePermissionItemsTargetingResource: deleteArtifactsFn = ({
  args,
  helpers,
}) =>
  helpers.withTxn(opts =>
    kSemanticModels.permissionItem().deleteManyByTargetId(args.resourceId, opts)
  );

export const deleteEntityPermissionItems: deleteArtifactsFn = ({args, helpers}) =>
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

export const getResourceAssignedItems: getArtifactsFn = ({args, opts}) =>
  kSemanticModels
    .assignedItem()
    .getResourceAssignedItems(
      args.workspaceId,
      args.resourceId,
      /** assignedItemType */ undefined,
      opts
    );

export const getResourceAssigneeItems: getArtifactsFn = ({args, opts}) =>
  kSemanticModels
    .assignedItem()
    .getResourceAssigneeItems(args.workspaceId, args.resourceId, opts);

export const getPermissionItemsTargetingResource: getArtifactsFn = ({args, opts}) =>
  kSemanticModels.permissionItem().getManyByTargetId(args.resourceId, opts);

export const getEntityPermissionItems: getArtifactsFn = ({args, opts}) =>
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
