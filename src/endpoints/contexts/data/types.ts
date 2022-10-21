import { ProjectionType, SortOrder } from 'mongoose';

export type DataQuerySort<T, K extends keyof T = keyof T> = {
  [P in K]?: SortOrder;
};

export interface IDataProvideQueryListParams<T> {
  page?: number;
  pageSize?: number;
  projection?: ProjectionType<T>;
  sort?: DataQuerySort<T>;
}

export type DT = string | number | boolean | null | undefined;
export interface IGeneralFieldQueryOps {
  $eq?: DT;
  $in?: DT[];
  $ne?: DT;
  $nin?: DT[];
  $not?: DT;
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
    
export type DataQuery<T, K extends keyof T = keyof T> = {
  [P in K]?: IFieldQueryOps ;
};

export interface IBaseDataProvider<T, Q = DataQuery<T>> {
  insertList: (items: T[]) => Promise<void>;
  getManyByQuery: <T1 extends Partial<T> = T>(
    q: Q,
    p?: IDataProvideQueryListParams<T>
  ) => Promise<T1[]>;
  getOneByQuery: <T1 extends Partial<T> = T>(
    q: Q,
    p?: Pick<IDataProvideQueryListParams<T>, 'projection'>
  ) => Promise<T1>;
  updateManyByQuery: (q: Q, d: Partial<T>) => Promise<void>;
  updateOneByQuery: <T1 extends Partial<T> = T>(
    q: Q,
    d: Partial<T>,
    p?: Pick<IDataProvideQueryListParams<T>, 'projection'>
  ) => Promise<T1>;
  existsByQuery: (q: Q) => Promise<boolean>;
  countByQuery: (q: Q) => Promise<number>;
}
