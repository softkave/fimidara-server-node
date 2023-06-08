import {ProjectionType, SortOrder} from 'mongoose';
import {AgentToken} from '../../../definitions/agentToken';
import {AssignedItem} from '../../../definitions/assignedItem';
import {CollaborationRequest} from '../../../definitions/collaborationRequest';
import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {Job} from '../../../definitions/job';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {PermissionItem} from '../../../definitions/permissionItem';
import {AppRuntimeState, ResourceWrapper} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {User} from '../../../definitions/user';
import {Workspace} from '../../../definitions/workspace';
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

export type IDataProviderQueryParams<T> = Pick<IDataProvideQueryListParams<T>, 'projection'>;

export const INCLUDE_IN_PROJECTION = 1 as const;
export const EXCLUDE_IN_PROJECTION = 0 as const;

export type DataProviderLiteralType = string | number | boolean | null | undefined | Date;

export interface ComparisonLiteralFieldQueryOps<T = DataProviderLiteralType> {
  $eq?: T | null;
  $lowercaseEq?: T;
  $in?: T[] | Array<T | null>;
  $lowercaseIn?: T[];
  $ne?: T | null;
  $nin?: Array<T | null>;

  // TODO: implement $not and in which bracket should it go?
  // $not?: T;
  $exists?: boolean;

  // TODO: allow only on strings
  $regex?: RegExp;
}

/**
 * Can also be used to query dates in Mongo.
 */
export interface NumberLiteralFieldQueryOps {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
}

export type LiteralFieldQueryOps<T = DataProviderLiteralType> = T extends DataProviderLiteralType
  ? (ComparisonLiteralFieldQueryOps<T> & NumberLiteralFieldQueryOps) | T | null
  : T extends Array<infer TArrayItem>
  ?
      | LiteralFieldQueryOps<TArrayItem>
      | Pick<ComparisonLiteralFieldQueryOps<T>, '$eq' | '$in' | '$lowercaseIn' | '$lowercaseEq'>
  : never;

export type LiteralDataQuery<T> = {
  [P in keyof T]?: LiteralFieldQueryOps<T[P]>;
};

export interface IRecordFieldQueryOps<T extends AnyObject> {
  // TODO: support nested $objMatch
  $objMatch: LiteralDataQuery<T>;
}

// TODO: support $objMatch in elemMatch
type ElemMatchQueryOp<T> = T extends AnyObject ? LiteralDataQuery<T> : LiteralFieldQueryOps<T>;

export interface IArrayFieldQueryOps<T> {
  $size?: number;

  // TODO: support $objMatch and $elemMatch in $all
  $all?: T extends DataProviderLiteralType ? Array<LiteralFieldQueryOps<T>> : never;
  $elemMatch?: ElemMatchQueryOp<T>;
}

export type DataQuery<T> = {
  [P in keyof T]?: T[P] extends DataProviderLiteralType | Date
    ? LiteralFieldQueryOps<T[P]>
    : NonNullable<T[P]> extends Array<infer U>
    ? IArrayFieldQueryOps<U>
    : NonNullable<T[P]> extends AnyObject
    ? IRecordFieldQueryOps<NonNullable<T[P]>>
    : void;
};

export enum BulkOpType {
  InsertOne = 1,
  ReplaceOne,
  UpdateOne,
  UpdateMany,
  DeleteOne,
  DeleteMany,
}

export type BulkOpItem<T> =
  | {type: BulkOpType.InsertOne; item: T}
  | {
      type: BulkOpType.UpdateOne;
      query: DataQuery<T>;
      update: Partial<T>;
      upsert?: boolean;
    }
  | {
      type: BulkOpType.UpdateMany;
      query: DataQuery<T>;
      update: Partial<T>;
    }
  | {type: BulkOpType.DeleteOne; query: DataQuery<T>}
  | {type: BulkOpType.DeleteMany; query: DataQuery<T>};

// TODO: infer resulting type from projection, otherwise default to full object
export interface BaseDataProvider<
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
    otherProps?: IDataProviderQueryParams<DataType>
  ) => Promise<DataType | null>;
  assertGetOneByQuery: (
    query: QueryType,
    otherProps?: IDataProviderQueryParams<DataType>
  ) => Promise<DataType>;
  assertGetAndUpdateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: IDataProviderQueryParams<DataType>
  ) => Promise<DataType>;
  countByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType
  ) => Promise<number>;
  countByQueryList: (query: QueryType[]) => Promise<number>;
  updateManyByQuery: (query: QueryType, data: Partial<DataType>) => Promise<void>;
  updateOneByQuery: (query: QueryType, data: Partial<DataType>) => Promise<void>;
  getAndUpdateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: IDataProviderQueryParams<DataType>
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
  TRANSACTION_bulkWrite(ops: Array<BulkOpItem<DataType>>): Promise<void>;
}

export type AgentTokenQuery = DataQuery<AgentToken>;
export type AgentTokenDataProvider = BaseDataProvider<AgentToken>;
export type AppRuntimeStateQuery = DataQuery<AppRuntimeState>;
export type AppRuntimeStateDataProvider = BaseDataProvider<AppRuntimeState>;
export type AssignedItemQuery<T extends AnyObject = AnyObject> = DataQuery<AssignedItem<T>>;
export type AssignedItemDataProvider = BaseDataProvider<AssignedItem>;
export type CollaborationRequestQuery = DataQuery<CollaborationRequest>;
export type CollaborationRequestDataProvider = BaseDataProvider<CollaborationRequest>;
export type FileQuery = DataQuery<File>;
export type FileDataProvider = BaseDataProvider<File>;
export type FolderQuery = DataQuery<Folder>;
export type FolderDataProvider = BaseDataProvider<Folder>;
export type PermissionGroupQuery = DataQuery<PermissionGroup>;
export type PermissionGroupDataProvider = BaseDataProvider<PermissionGroup>;
export type PermissionItemQuery = DataQuery<PermissionItem>;
export type PermissionItemDataProvider = BaseDataProvider<PermissionItem>;
export type TagQuery = DataQuery<Tag>;
export type TagDataProvider = BaseDataProvider<Tag>;
export type UsageRecordQuery = DataQuery<UsageRecord>;
export type UsageRecordDataProvider = BaseDataProvider<UsageRecord>;
export type UserQuery = DataQuery<User>;
export type UserDataProvider = BaseDataProvider<User>;
export type WorkspaceQuery = DataQuery<Workspace>;
export type WorkspaceDataProvider = BaseDataProvider<Workspace>;
export type ResourceDataProvider = BaseDataProvider<ResourceWrapper>;
export type JobDataProvider = BaseDataProvider<Job>;
