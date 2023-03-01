import {IAssignedItem} from '../../../../definitions/assignedItem';
import {AnyObject} from '../../../../utils/types';
import {DataQuery, IBaseDataProvider} from '../types';

export type IAssignedItemQuery<T extends AnyObject = AnyObject> = DataQuery<IAssignedItem<T>>;
export type IAssignedItemDataProvider = IBaseDataProvider<IAssignedItem>;
