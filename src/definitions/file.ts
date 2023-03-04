import {ConvertAgentToPublicAgent, IWorkspaceResourceBase} from './system';

export interface IFile extends IWorkspaceResourceBase {
  folderId?: string;
  idPath: string[];
  namePath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  name: string;
  extension: string;
  description?: string;
}

export type IPublicFile = ConvertAgentToPublicAgent<IFile>;
export type IFileMatcher = {
  // file path with workspace root name
  filepath?: string;
  fileId?: string;
};
