import {IFile} from '../../../../definitions/file';
import {throwFileNotFound} from '../../../files/utils';
import {BaseMongoDataProvider} from '../utils';
import {IFileDataProvider} from './type';

export class FileMongoDataProvider extends BaseMongoDataProvider<IFile> implements IFileDataProvider {
  throwNotFound = throwFileNotFound;
}
