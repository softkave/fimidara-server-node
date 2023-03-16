import {AppResourceType, BasicCRUDActions} from '../../definitions/system';

export interface IPermissionItemInput {
  containerId?: string;
  targetId?: string;
  targetType?: AppResourceType;
  grantAccess?: boolean;
  action: BasicCRUDActions;
}
