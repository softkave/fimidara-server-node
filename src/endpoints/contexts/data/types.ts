import {ProjectionType, SortOrder} from 'mongoose';
import {AnyObject} from '../../../utils/types';

export type DataQuerySort<T, K extends keyof T = keyof T> = {
  [P in K]?: SortOrder;
};

export interface IDataProvideQueryListParams<T> {
  /** zero-based index */
  page?: number;
  pageSize?: number;
  projection?: ProjectionType<T>;
  sort?: DataQuerySort<T>;
}

export type DataProviderLiteralType = string | number | boolean | null | undefined | Date;

// TODO: reclassify ops based on Mongo ops, but split comparison into number and
// other literals
export interface IComparisonLiteralFieldQueryOps<
  T extends DataProviderLiteralType = DataProviderLiteralType
> {
  $eq?: T | null;
  $in?: Array<T | null>;
  $ne?: T | null;
  $nin?: Array<T | null>;

  // TODO: implement $not and in which bracket should it go?
  // $not?: T;
  $exists?: boolean;
  $regex?: RegExp;
}

/**
 * Can also be used to query dates in Mongo.
 */
export interface INumberLiteralFieldQueryOps {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
}

export type ILiteralFieldQueryOps<T = DataProviderLiteralType> = T extends DataProviderLiteralType
  ? (IComparisonLiteralFieldQueryOps<T> & INumberLiteralFieldQueryOps) | T | null
  : null;

type LiteralDataQuery<T> = {
  [P in keyof T]?: ILiteralFieldQueryOps<T[P]>;
};

export interface IRecordFieldQueryOps<T extends AnyObject> {
  // TODO: support nested $objMatch
  $objMatch: LiteralDataQuery<T>;
}

// TODO: support $objMatch in elemMatch
type ElemMatchQueryOp<T> = T extends AnyObject ? LiteralDataQuery<T> : ILiteralFieldQueryOps<T>;

export interface IArrayFieldQueryOps<T> {
  $size?: number;

  // TODO: support $objMatch and $elemMatch in $all
  $all?: T extends DataProviderLiteralType ? Array<ILiteralFieldQueryOps<T>> : never;
  $elemMatch?: ElemMatchQueryOp<T>;
}

export type DataQuery<T> = {
  [P in keyof T]?: T[P] extends DataProviderLiteralType | Date
    ? ILiteralFieldQueryOps<T[P]>
    : NonNullable<T[P]> extends Array<infer U>
    ? IArrayFieldQueryOps<U>
    : NonNullable<T[P]> extends AnyObject
    ? IRecordFieldQueryOps<NonNullable<T[P]>>
    : void;
};

// TODO: infer resulting type from projection, otherwise default to full object
export interface IBaseDataProvider<
  DataType,
  QueryType extends DataQuery<DataType> = DataQuery<DataType>
> {
  insertItem: (items: DataType) => Promise<DataType>;
  insertList: (items: DataType[]) => Promise<void>;

  existsByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType
  ) => Promise<boolean>;

  getManyByQuery: (
    query: QueryType,
    otherProps?: IDataProvideQueryListParams<DataType>
  ) => Promise<DataType[]>;
  getManyByQueryList: (
    query: QueryType[],
    otherProps?: IDataProvideQueryListParams<DataType>
  ) => Promise<DataType[]>;
  getOneByQuery: (
    query: QueryType,
    otherProps?: Pick<IDataProvideQueryListParams<DataType>, 'projection'>
  ) => Promise<DataType | null>;
  assertGetOneByQuery: (
    query: QueryType,
    otherProps?: Pick<IDataProvideQueryListParams<DataType>, 'projection'>
  ) => Promise<DataType>;
  assertGetAndUpdateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: Pick<IDataProvideQueryListParams<DataType>, 'projection'>
  ) => Promise<DataType>;

  countByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType
  ) => Promise<number>;
  countByQueryList: (query: QueryType[]) => Promise<number>;

  updateManyByQuery: (query: QueryType, data: Partial<DataType>) => Promise<void>;
  updateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: Pick<IDataProvideQueryListParams<DataType>, 'projection'>
  ) => Promise<void>;
  getAndUpdateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: Pick<IDataProvideQueryListParams<DataType>, 'projection'>
  ) => Promise<DataType | null>;

  deleteManyByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType
  ) => Promise<void>;
  deleteManyByQueryList: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType[]
  ) => Promise<void>;
  deleteOneByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType
  ) => Promise<void>;
}
