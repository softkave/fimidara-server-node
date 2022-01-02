import {IAgent} from '../../definitions/system';

export interface IPublicFile {
  fileId: string;
  organizationId: string;
  folderId?: string;
  idPath: string[];
  namePath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  createdBy: IAgent;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  extension: string;
  description?: string;
  isPublic?: boolean;
  markedPublicAt?: string; // ISO date string
  markedPublicBy?: IAgent;
}
