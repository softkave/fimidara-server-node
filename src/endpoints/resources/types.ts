import {AppResourceType, IResourceBase} from '../../definitions/system';

export interface IResource<T extends IResourceBase = IResourceBase> {
  resourceId: string;
  resourceType: AppResourceType;
  resource: T;
}

export interface IOrganizationResource extends IResourceBase {
  organizationId: string;
}
