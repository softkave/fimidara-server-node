import {IFileMatcher} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export type IDeleteFileParams = IFileMatcher;
export type DeleteFileEndpoint = Endpoint<IBaseContext, IDeleteFileParams>;
