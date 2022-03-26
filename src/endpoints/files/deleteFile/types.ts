import {IFileMatcher} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteFileParams extends IFileMatcher {}
export type DeleteFileEndpoint = Endpoint<IBaseContext, IDeleteFileParams>;
