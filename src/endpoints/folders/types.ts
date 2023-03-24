import {AppActionType, AppResourceType} from '../../definitions/system';

export interface IFolderPublicAccessOpInput {
  action: AppActionType;
  resourceType: AppResourceType;
  appliesToFolder?: boolean;
}
