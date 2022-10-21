import {ITag} from '../../../../definitions/tag';
import {BaseMongoDataProvider} from '../utils';
import {ITagDataProvider} from './type';

export class TagMongoDataProvider
  extends BaseMongoDataProvider<ITag>
  implements ITagDataProvider {}
