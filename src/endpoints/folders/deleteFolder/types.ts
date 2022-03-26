import {IFolderMatcher} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteFolderParams extends IFolderMatcher {}
export type DeleteFolderEndpoint = Endpoint<IBaseContext, IDeleteFolderParams>;
