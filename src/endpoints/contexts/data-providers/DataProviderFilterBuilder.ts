import {
  DataProviderFilterValueOperator,
  DataProviderGetValueType,
  DataProviderValueExpander,
  IDataProviderFilterBuilder,
  IDataProviderFilterValue,
} from './DataProvider';

/**
 * TODO:
 * - [Medium] Provide better type definitions for the key and matching to values.
 *   Keys can be arbitrarily deep properties with number for array fields, and the
 *   keys should be able to match to their values for type checking also.
 */

export default class DataProviderFilterBuilder<T extends {[key: string]: any}>
  implements IDataProviderFilterBuilder<T> {
  private data: {[K in keyof T]?: IDataProviderFilterValue<T[K]>} = {};

  public addItem<K extends keyof T>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator
  ) {
    this.data[key] = {value, queryOp};
    return this;
  }

  public addItemWithStringKey<K extends keyof T | string>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator
  ) {
    this.data[key] = {value, queryOp};
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
