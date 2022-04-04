import {IFileMatcher} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export type IDeleteFileEndpointParams = IFileMatcher;
export type DeleteFileEndpoint = Endpoint<
  IBaseContext,
  IDeleteFileEndpointParams
>;
