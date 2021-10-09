import {IAgent} from '../../definitions/system';

export interface IPublicFolder {
  folderId: string;
  organizationId: string;
  environmentId: string;
  parentId?: string;
  createdBy: IAgent;
  createdAt: string;
  maxFileSize: number;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}
