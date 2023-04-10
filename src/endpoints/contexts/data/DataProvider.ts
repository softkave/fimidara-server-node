import {LiteralDataQuery} from './types';

export enum DataProviderFilterValueOperator {
  Equal,
  GreaterThan,
  GreaterThanOrEqual,
  In,
  LessThan,
  LessThanOrEqual,
  NotEqual,
  NotIn,

  // MongoDB doesn't support the 'g' (global) flag that Javascript Regex supports
  Regex,
  Object,
  // None,
}

export enum DataProviderFilterValueLogicalOperator {
  Not,
}

export type DataProviderValueExpander<T> = ReadonlyArray<T> | T | RegExp | null;
export type DataProviderGetValueType<Value> = Value extends any[]
  ? Value[0]
  : Value extends {[key: string]: any}
  ? Partial<Value>
  : Value;

export interface IDataProviderFilterValue<Value> {
  value: DataProviderValueExpander<DataProviderGetValueType<Value>>;
  queryOp?: DataProviderFilterValueOperator;
  logicalOp?: DataProviderFilterValueLogicalOperator;
}

// TODO: support combine operators for filtering
export enum DataProviderFilterCombineOperator {
  Or,
  And,
  Nor,
}

export type IDataProviderFilter<T extends {[key: string]: any}> = {
  items: {[K in keyof T]?: IDataProviderFilterValue<T[K]>};
};

export interface IDataProviderFilterBuilder<T extends {[key: string]: any}> {
  addItem: <K extends keyof T>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator
  ) => IDataProviderFilterBuilder<T>;

  // TODO: deprecate function when deep field type is implemented
  addItemWithStringKey: <K extends keyof T | string>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator
  ) => IDataProviderFilterBuilder<T>;
  addItemValue: <K extends keyof T>(
    key: K,
    value: IDataProviderFilterValue<T[K]>
  ) => IDataProviderFilterBuilder<T>;
  build: () => LiteralDataQuery<T>;
}
