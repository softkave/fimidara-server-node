import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteFolderParams {
  folderId: string;
}

export type DeleteFolderEndpoint = Endpoint<IBaseContext, IDeleteFolderParams>;
