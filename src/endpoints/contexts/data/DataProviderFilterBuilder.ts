import {isUndefined} from 'lodash';
import {
  DataProviderFilterValueOperator,
  DataProviderGetValueType,
  DataProviderValueExpander,
  IDataProviderFilterBuilder,
  IDataProviderFilterValue,
} from './DataProvider';
import {LiteralDataQuery} from './types';

export default class DataProviderFilterBuilder<T extends {[key: string]: any}>
  implements IDataProviderFilterBuilder<T>
{
  static FILTER_OP_TO_DATA_QUERY_OP: Record<DataProviderFilterValueOperator, string> = {
    [DataProviderFilterValueOperator.Equal]: '$eq',
    [DataProviderFilterValueOperator.GreaterThan]: '$gt',
    [DataProviderFilterValueOperator.GreaterThanOrEqual]: '$gte',
    [DataProviderFilterValueOperator.In]: '$in',
    [DataProviderFilterValueOperator.LessThan]: '$lt',
    [DataProviderFilterValueOperator.LessThanOrEqual]: '$lte',
    [DataProviderFilterValueOperator.NotEqual]: '$ne',
    [DataProviderFilterValueOperator.NotIn]: '$nin',
    [DataProviderFilterValueOperator.Regex]: '$regex',
    [DataProviderFilterValueOperator.Object]: '$objMatch',
  };

  private data: {[K in keyof T]?: IDataProviderFilterValue<T[K]>} = {};

  addItem<K extends keyof T>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator
  ) {
    this.data[key] = {value, queryOp};
    return this;
  }

  addItemWithStringKey<K extends keyof T | string>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator
  ) {
    this.data[key] = {value, queryOp};
    return this;
  }

  addItemValue<K extends keyof T>(key: K, value: IDataProviderFilterValue<T[K]>) {
    this.data[key] = value;
    return this;
  }

  build(): LiteralDataQuery<T> {
    const q: LiteralDataQuery<T> = {};
    for (const k in this.data) {
      // TODO: handle logical op and other ops
      // TODO: fix the type issue on assigning the value to the op below
      const entry = this.data[k];
      const dQueryOp =
        entry && !isUndefined(entry?.queryOp)
          ? DataProviderFilterBuilder.FILTER_OP_TO_DATA_QUERY_OP[entry.queryOp]
          : null;
      if (dQueryOp) {
        q[k] = {[dQueryOp]: entry?.value} as any;
      }
    }
    return q;
  }
}
