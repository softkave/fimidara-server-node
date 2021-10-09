import {IAgent} from '../../definitions/system';

export interface IPublicFile {
  fileId: string;
  organizationId: string;
  environmentId: string;
  folderId?: string;
  mimetype: string;
  encoding: string;
  size: number;
  createdBy: IAgent;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
  meta?: Record<string, string | number | boolean | null>;
}
