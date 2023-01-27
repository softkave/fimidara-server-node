import {IFolder} from '../../../../definitions/folder';
import {throwFolderNotFound} from '../../../folders/utils';
import {BaseMongoDataProvider} from '../utils';
import {IFolderDataProvider} from './type';

export class FolderMongoDataProvider extends BaseMongoDataProvider<IFolder> implements IFolderDataProvider {
  throwNotFound = throwFolderNotFound;
}
