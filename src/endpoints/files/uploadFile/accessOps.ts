import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
} from '../../../definitions/system';
import {compactPublicAccessOps} from '../../../definitions/utils';
import {getDate} from '../../../utilities/dateFns';
import {UploadFilePublicAccessActions} from './types';

export const makeFilePublicReadAccessOps = (
  agent: IAgent
): IPublicAccessOp[] => [
  {
    action: BasicCRUDActions.Read,
    markedAt: getDate(),
    markedBy: agent,
    resourceType: AppResourceType.File,
    appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
  },
];

export const makeFilePublicReadAndUpdateAccessOps = (
  agent: IAgent
): IPublicAccessOp[] =>
  makeFilePublicReadAccessOps(agent).concat([
    {
      action: BasicCRUDActions.Update,
      markedAt: getDate(),
      markedBy: agent,
      resourceType: AppResourceType.File,
      appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
    },
    {
      action: BasicCRUDActions.Create,
      markedAt: getDate(),
      markedBy: agent,
      resourceType: AppResourceType.File,
      appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
    },
  ]);

export const makeFilePublicReadUpdateAndDeleteAccessOps = (
  agent: IAgent
): IPublicAccessOp[] =>
  makeFilePublicReadAndUpdateAccessOps(agent).concat([
    {
      action: BasicCRUDActions.Delete,
      markedAt: getDate(),
      markedBy: agent,
      resourceType: AppResourceType.File,
      appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
    },
  ]);

export const makeFilePublicAccessOps = (
  agent: IAgent,
  action: UploadFilePublicAccessActions | undefined | null,
  existingOps: IPublicAccessOp[] = []
) => {
  switch (action) {
    case UploadFilePublicAccessActions.Read:
      return compactPublicAccessOps(
        existingOps.concat(makeFilePublicReadAccessOps(agent))
      );
    case UploadFilePublicAccessActions.ReadAndUpdate:
      return compactPublicAccessOps(
        existingOps.concat(makeFilePublicReadAndUpdateAccessOps(agent))
      );
    case UploadFilePublicAccessActions.ReadUpdateAndDelete:
      return compactPublicAccessOps(
        existingOps.concat(makeFilePublicReadUpdateAndDeleteAccessOps(agent))
      );
    case UploadFilePublicAccessActions.None:
      return [];
    default:
      return existingOps;
  }
};
