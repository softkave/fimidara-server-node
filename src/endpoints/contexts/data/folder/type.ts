import {IFolder} from '../../../../definitions/folder';
import {DataQuery, IBaseDataProvider} from '../types';

export type IFolderQuery = DataQuery<IFolder>;
export type IFolderDataProvider = IBaseDataProvider<IFolder>;
