import {IFile} from '../../../../definitions/file';
import {DataQuery, IBaseDataProvider} from '../types';

export type IFileQuery = DataQuery<IFile>;
export type IFileDataProvider = IBaseDataProvider<IFile>;
