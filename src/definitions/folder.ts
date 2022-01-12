import {IAgent} from './system';

export interface IFolder {
  resourceId: string;
  organizationId: string;
  // bucketId: string;
  // environmentId: string;
  idPath: string[];
  namePath: string[];
  parentId?: string;
  createdBy: IAgent;
  createdAt: string;
  maxFileSizeInBytes: number;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  markedPublicAt?: string; // ISO date string
  markedPublicBy?: IAgent;
}
