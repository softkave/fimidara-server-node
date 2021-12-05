import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteFileParams {
  // fileId: string;
  path: string;
  organizationId?: string;
}

export type DeleteFileEndpoint = Endpoint<IBaseContext, IDeleteFileParams>;
