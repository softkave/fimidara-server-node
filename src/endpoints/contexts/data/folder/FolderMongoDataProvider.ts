import {IFolder} from '../../../../definitions/folder';
import {BaseMongoDataProvider} from '../utils';
import {IFolderDataProvider} from './type';

export class FolderMongoDataProvider
  extends BaseMongoDataProvider<IFolder>
  implements IFolderDataProvider {}
