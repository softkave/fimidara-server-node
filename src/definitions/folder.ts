import {IAgent} from './system';

export interface IFolder {
  folderId: string;
  idPath: string[]; // TODO: idPath should be parent path
  namePath: string[];
  organizationId: string;
  bucketId: string;
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
