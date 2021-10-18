import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteFileParams {
  fileId: string;
}

export type DeleteFileEndpoint = Endpoint<IBaseContext, IDeleteFileParams>;
