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

export type DataProviderValueExpander<T> = Array<T> | T | RegExp | null;
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
    // logicalOp?: DataProviderFilterValueLogicalOperator
  ) => IDataProviderFilterBuilder<T>;

  // TODO: deprecate function when deep field type is implemented
  addItemWithStringKey: <K extends keyof T | string>(
    key: K,
    value: DataProviderValueExpander<DataProviderGetValueType<T[K]>>,
    queryOp?: DataProviderFilterValueOperator
    // logicalOp?: DataProviderFilterValueLogicalOperator
  ) => IDataProviderFilterBuilder<T>;

  addItemValue: <K extends keyof T>(
    key: K,
    value: IDataProviderFilterValue<T[K]>
  ) => IDataProviderFilterBuilder<T>;

  build: () => IDataProviderFilter<T>;
}

export interface IGetManyItemsOptions {
  limit?: number;
}

/**
 * TODO: Work on new query approach where we use objects reducing the verbosity
 * of having to write little queries. With it, we'd be able to query like so"
 * {
 *    userId: data.userId,
 *    organizations: matchInArray({
 *        organizationId: data.organizationId
 *    }),
 *    createdAt: matchInObject({
 *        agentId: data.agentId
 *    }),
 *    email: matchRegex(new RegEx("^" + data.email + "$"))
 * }
 *
 * We'd have query helpers like match... functions. They'll produce a
 * DataProviderQueryMatch object and the overall query will be converted into
 * the query language of the underlying data provider.
 */

// TODO: How to handle combining queries with and, or, nor, etc.

export interface IDataProvider<T extends {[key: string]: any}> {
  checkItemExists: (filter: IDataProviderFilter<T>) => Promise<boolean>;
  getItem: (filter: IDataProviderFilter<T>) => Promise<T | null>;

  // TODO: use options with a sortBy field
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
  ) => Promise<void>;

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
