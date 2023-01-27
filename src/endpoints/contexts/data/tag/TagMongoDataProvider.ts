import {ITag} from '../../../../definitions/tag';
import {throwTagNotFound} from '../../../tags/utils';
import {BaseMongoDataProvider} from '../utils';
import {ITagDataProvider} from './type';

export class TagMongoDataProvider extends BaseMongoDataProvider<ITag> implements ITagDataProvider {
  throwNotFound = throwTagNotFound;
}
