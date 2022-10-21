import {IWorkspace} from '../../../../definitions/workspace';
import {DataQuery, IBaseDataProvider} from '../types';

export type IWorkspaceQuery = DataQuery<IWorkspace>;
export type IWorkspaceDataProvider = IBaseDataProvider<IWorkspace>;
