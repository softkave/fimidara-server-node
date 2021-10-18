import {IDataProviderFilterBuilder} from './DataProvider';

export default class DataProviderFilterBuilder<
  T extends Record<string, unknown>
> implements IDataProviderFilterBuilder<T> {
  addItem: <K extends keyof T>(
    key: K,
    value: ValueExpander<GetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator,
    logicalOp?: DataProviderFilterValueLogicalOperator
  ) => IDataProviderFilterBuilder<T>;
  addItemBuilder: <K extends keyof T>(
    key: K,
    valueBuilder: IDataProviderFilterValueBuilder<T[K]>
  ) => IDataProviderFilterBuilder<T>;
  addItemValue: <K extends keyof T>(
    key: K,
    valueBuilder: IDataProviderFilterValue<T[K]>
  ) => IDataProviderFilterBuilder<T>;
  addCombineOp: (
    combineOp?: DataProviderFilterCombineOperator
  ) => IDataProviderFilterBuilder<T>;
  build: () => IDataProviderFilter<T>;
}
