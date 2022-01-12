import {IAgent} from '../../definitions/system';

export interface IPublicFolder {
  resourceId: string;
  organizationId: string;
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
