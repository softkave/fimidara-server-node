import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteFolderParams {
  // folderId: string;
  organizationId?: string;
  path: string;
}

export type DeleteFolderEndpoint = Endpoint<IBaseContext, IDeleteFolderParams>;
