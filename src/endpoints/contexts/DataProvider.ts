export enum DataProviderFilterValueOperator {
  Equal,
  GreaterThan,
  GreaterThanOrEqual,
  In,
  LessThan,
  LessThanOrEqual,
  NotEqual,
  NotIn,
  Regex, // TODO: when using regex for checking existence, how should that work?
  Object,
  None,
}

export enum DataProviderFilterValueLogicalOperator {
  Not,
}

type ValueExpander<T> = Array<T> | T | null;
type GetValueType<Value> = Value extends any[]
  ? Value[0]
  : Value extends Record<string, unknown>
  ? Partial<Value>
  : Value;

export interface IDataProviderFilterValue<Value> {
  value: ValueExpander<GetValueType<Value>>;
  queryOp?: DataProviderFilterValueOperator;
  logicalOp?: DataProviderFilterValueLogicalOperator;
}

export enum DataProviderFilterCombineOperator {
  Or,
  And,
  Nor,
}

export type IDataProviderFilter<T extends Record<string, unknown>> = {
  items: Array<{[K in keyof T]?: IDataProviderFilterValue<T[K]>}>;
  combineOp?: DataProviderFilterCombineOperator;
};

export interface IDataProviderFilterValueBuilder<Value> {
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

export interface IDataProviderFilterBuilder<T extends Record<string, unknown>> {
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

export interface IGetManyItemsOptions {
  limit?: number;
}

export interface IDataProvider<T extends Record<string, unknown>> {
  checkItemExists: (filter: IDataProviderFilter<T>) => Promise<boolean>;
  getItem: (filter: IDataProviderFilter<T>) => Promise<T | null>;
  getManyItems: (
    filter: IDataProviderFilter<T>,
    options?: IGetManyItemsOptions
  ) => Promise<Array<T>>;
  deleteItem: (filter: IDataProviderFilter<T>) => Promise<void>;
  updateItem: (
    filter: IDataProviderFilter<T>,
    data: Partial<T>
  ) => Promise<T | null>;
  updateManyItems: (
    filter: IDataProviderFilter<T>,
    data: Partial<T>
  ) => Promise<T | null>;
  bulkUpdateItems: (
    items: Array<{
      filter: IDataProviderFilter<T>;
      data: Partial<T>;
      updateFirstItemOnly?: boolean;
    }>
  ) => Promise<void>;
  assertUpdateItem: (
    filter: IDataProviderFilter<T>,
    data: Partial<T>,
    throwError?: () => void
  ) => Promise<T>;
  deleteManyItems: (filter: IDataProviderFilter<T>) => Promise<void>;
  // bulkDeleteItems: (
  //   items: Array<{
  //     filter: IDataProviderFilter<T>;
  //     deleteFirstItemOnly?: boolean;
  //   }>
  // ) => Promise<void>;
  assertItemExists: (
    filter: IDataProviderFilter<T>,
    throwError?: () => void
  ) => Promise<boolean>;
  assertGetItem: (
    filter: IDataProviderFilter<T>,
    throwError?: () => void
  ) => Promise<T>;
  saveItem: (data: T) => Promise<T>;
  bulkSaveItems: (data: T[]) => Promise<void>;
}
