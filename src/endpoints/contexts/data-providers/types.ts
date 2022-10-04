import {ProjectionType} from 'mongoose';

export interface IDataProviderUpdateOp<Q, T> {
  query: Q;
  update: T;
}

export interface IDataProvideQueryListParams<T> {
  page?: number;
  pageSize?: number;
  projection?: ProjectionType<T>;
}

export type DataProviderFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface IGeneralFieldQueryOps {
  $eq?: DataProviderFieldValue;
  $in?: DataProviderFieldValue[];
  $ne?: DataProviderFieldValue;
  $nin?: DataProviderFieldValue[];
  $not?: DataProviderFieldValue;
  $exists?: boolean;
}

export interface INumberOrDateFieldQueryOps {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
}

export interface IFieldQueryOps
  extends IGeneralFieldQueryOps,
    INumberOrDateFieldQueryOps {}

export type QD<T, K extends keyof T = keyof T> = {
  [P in K]?: IFieldQueryOps | DataProviderFieldValue;
};
