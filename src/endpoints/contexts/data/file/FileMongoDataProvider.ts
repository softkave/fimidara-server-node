import {IFile} from '../../../../definitions/file';
import {BaseMongoDataProvider} from '../utils';
import {IFileDataProvider} from './type';

export class FileMongoDataProvider
  extends BaseMongoDataProvider<IFile>
  implements IFileDataProvider {}
