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
  createdAt: Date | string;
  maxFileSizeInBytes: number;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  name: string;
  description?: string;

  // TODO: add which op is public
  // OR have a public preset by defaualt and add public
  // resources to it
  isPublic?: boolean;
  markedPublicAt?: Date | string; // ISO date string
  markedPublicBy?: IAgent;
}
