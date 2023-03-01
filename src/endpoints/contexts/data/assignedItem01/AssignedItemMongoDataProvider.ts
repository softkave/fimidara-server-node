import {IAssignedItem} from '../../../../definitions/assignedItem';
import {throwAssignedItemNotFound} from '../../../assignedItems/utils';
import {BaseMongoDataProvider} from '../utils';
import {IAssignedItemDataProvider} from './type';

export class AssignedItemMongoDataProvider
  extends BaseMongoDataProvider<IAssignedItem>
  implements IAssignedItemDataProvider
{
  throwNotFound = throwAssignedItemNotFound;
}
