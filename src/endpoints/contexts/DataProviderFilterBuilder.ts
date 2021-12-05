import {
  DataProviderFilterValueLogicalOperator,
  DataProviderFilterValueOperator,
  DataProviderGetValueType,
  IDataProviderFilterBuilder,
  IDataProviderFilterValue,
  DataProviderValueExpander,
} from './DataProvider';

export default class DataProviderFilterBuilder<
  T extends Record<string, unknown>
> implements IDataProviderFilterBuilder<T> {
  private data: {[K in keyof T]?: IDataProviderFilterValue<T[K]>} = {};

  public addItem<K extends keyof T>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator,
    logicalOp?: DataProviderFilterValueLogicalOperator
  ) {
    this.data[key] = {value, queryOp, logicalOp};
    return this;
  }

  public addItemValue<K extends keyof T>(
    key: K,
    value: IDataProviderFilterValue<T[K]>
  ) {
    this.data[key] = value;
    return this;
  }

  public build() {
    return {
      items: this.data,
    };
  }
}
