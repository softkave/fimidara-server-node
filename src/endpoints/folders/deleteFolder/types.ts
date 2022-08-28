import {IFolderMatcher} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IDeleteFolderEndpointParams = IFolderMatcher;
export type DeleteFolderEndpoint = Endpoint<
  IBaseContext,
  IDeleteFolderEndpointParams
>;
