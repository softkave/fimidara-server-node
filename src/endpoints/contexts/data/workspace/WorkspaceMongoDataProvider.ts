import {IWorkspace} from '../../../../definitions/workspace';
import {throwWorkspaceNotFound} from '../../../workspaces/utils';
import {BaseMongoDataProvider} from '../utils';
import {IWorkspaceDataProvider} from './type';

export class WorkspaceMongoDataProvider extends BaseMongoDataProvider<IWorkspace> implements IWorkspaceDataProvider {
  throwNotFound = throwWorkspaceNotFound;
}
