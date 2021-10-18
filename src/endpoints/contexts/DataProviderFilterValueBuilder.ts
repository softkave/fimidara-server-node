import {IDataProviderFilterValueBuilder} from './DataProvider';

export default class DataProviderFilterValueBuilder<T>
  implements IDataProviderFilterValueBuilder<T> {
  addValue: (
    value: ValueExpander<GetValueType<Value>>
  ) => IDataProviderFilterValueBuilder<Value>;
  addQueryOp: (
    queryOp: DataProviderFilterValueOperator
  ) => IDataProviderFilterValueBuilder<Value>;
  addLogicalOp: (
    logicalOp: DataProviderFilterValueLogicalOperator
  ) => IDataProviderFilterValueBuilder<Value>;
  build: () => IDataProviderFilterValue<Value>;
}
