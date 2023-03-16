import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {compactPublicAccessOps} from '../../../utils/publicAccessOps';
import {UploadFilePublicAccessActions} from './types';

export const makeFilePublicReadAccessOps = (agent: IAgent): IPublicAccessOp[] => [
  {
    action: BasicCRUDActions.Read,
    markedAt: getTimestamp(),
    markedBy: agent,
    resourceType: AppResourceType.File,
  },
];

export const makeFilePublicReadAndUpdateAccessOps = (agent: IAgent): IPublicAccessOp[] =>
  makeFilePublicReadAccessOps(agent).concat([
    {
      action: BasicCRUDActions.Update,
      markedAt: getTimestamp(),
      markedBy: agent,
      resourceType: AppResourceType.File,
    },
    {
      action: BasicCRUDActions.Create,
      markedAt: getTimestamp(),
      markedBy: agent,
      resourceType: AppResourceType.File,
    },
  ]);

export const makeFilePublicReadUpdateAndDeleteAccessOps = (agent: IAgent): IPublicAccessOp[] =>
  makeFilePublicReadAndUpdateAccessOps(agent).concat([
    {
      action: BasicCRUDActions.Delete,
      markedAt: getTimestamp(),
      markedBy: agent,
      resourceType: AppResourceType.File,
    },
  ]);

export const makeFilePublicAccessOps = (
  agent: IAgent,
  action: UploadFilePublicAccessActions | undefined | null,
  existingOps: IPublicAccessOp[] = []
) => {
  switch (action) {
    case UploadFilePublicAccessActions.Read:
      return compactPublicAccessOps(existingOps.concat(makeFilePublicReadAccessOps(agent)));
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
