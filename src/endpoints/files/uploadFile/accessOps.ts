import {
  IAgent,
  IPublicAccessOp,
  BasicCRUDActions,
  AppResourceType,
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
    },
  ]);

export const makeFilePublicReadUpdateAndDeleteAccessOps = (
  agent: IAgent
): IPublicAccessOp[] =>
  makeFilePublicReadAndUpdateAccessOps(agent).concat([
    {
      action: BasicCRUDActions.Update,
      markedAt: getDate(),
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
    default:
      return [];
  }
};
