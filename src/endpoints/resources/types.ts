import {ExportedHttpEndpoint} from '../types';
import {GetResourcesEndpoint} from './getResources/types';

export interface FetchResourceItem {
  resourceId?: string | string[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
}

export type ResourcesExportedEndpoints = {
  getResources: ExportedHttpEndpoint<GetResourcesEndpoint>;
};
