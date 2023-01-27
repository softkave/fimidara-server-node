import {ProjectionType, SortOrder} from 'mongoose';
import {AnyObject} from '../../../utils/types';

export type DataQuerySort<T, K extends keyof T = keyof T> = {
  [P in K]?: SortOrder;
};

export interface IDataProvideQueryListParams<T> {
  page?: number;
  pageSize?: number;
  projection?: ProjectionType<T>;
  sort?: DataQuerySort<T>;
}

export type DataProviderLiteralType = string | number | boolean | null | undefined | Date;

// TODO: reclassify ops based on Mongo ops, but split comparison into number and other literals
export interface IComparisonLiteralFieldQueryOps<T extends DataProviderLiteralType = DataProviderLiteralType> {
  $eq?: T;
  $in?: T extends string ? Array<T | RegExp> : Array<T>;
  $ne?: T;
  $nin?: T[];

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
  ? (IComparisonLiteralFieldQueryOps<T> & INumberLiteralFieldQueryOps) | T
  : never;

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
export interface IBaseDataProvider<T, Q extends DataQuery<T> = DataQuery<T>> {
  insertItem: (items: T) => Promise<T>;
  insertList: (items: T[]) => Promise<void>;
  getManyByQuery: (q: Q, p?: IDataProvideQueryListParams<T>) => Promise<T[]>;
  getManyByQueries: (q: Q[], p?: IDataProvideQueryListParams<T>) => Promise<T[]>;
  getOneByQuery: (q: Q, p?: Pick<IDataProvideQueryListParams<T>, 'projection'>) => Promise<T | null>;
  assertGetOneByQuery: (q: Q, p?: Pick<IDataProvideQueryListParams<T>, 'projection'>) => Promise<T>;
  updateManyByQuery: (q: Q, d: Partial<T>) => Promise<void>;
  updateOneByQuery: (q: Q, d: Partial<T>, p?: Pick<IDataProvideQueryListParams<T>, 'projection'>) => Promise<void>;
  getAndUpdateOneByQuery: (
    q: Q,
    d: Partial<T>,
    p?: Pick<IDataProvideQueryListParams<T>, 'projection'>
  ) => Promise<T | null>;
  assertGetAndUpdateOneByQuery: (
    q: Q,
    d: Partial<T>,
    p?: Pick<IDataProvideQueryListParams<T>, 'projection'>
  ) => Promise<T>;
  existsByQuery: <Q1 extends Q = Q>(q: Q1) => Promise<boolean>;
  countByQuery: <Q1 extends Q = Q>(q: Q1) => Promise<number>;
  deleteManyByQuery: <Q1 extends Q = Q>(q: Q1) => Promise<void>;
  deleteManyByQueries: <Q1 extends Q = Q>(q: Q1[]) => Promise<void>;
  deleteOneByQuery: <Q1 extends Q = Q>(q: Q1) => Promise<void>;
}
