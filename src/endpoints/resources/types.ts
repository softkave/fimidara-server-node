import {AppResourceType, IResource} from '../../definitions/system';

export interface IResourceContainer<T extends IResource = IResource> {
  resourceId: string;
  resourceType: AppResourceType;
  resource: T;
}

export interface IFetchResourceItem {
  resourceId: string;
}
