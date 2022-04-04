import {IFolderMatcher} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export type IDeleteFolderEndpointParams = IFolderMatcher;
export type DeleteFolderEndpoint = Endpoint<
  IBaseContext,
  IDeleteFolderEndpointParams
>;
