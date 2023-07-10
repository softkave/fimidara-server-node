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
import {AnyFn, AnyObject} from '../../../utils/types';
import {BaseContextType} from '../types';

export type DataQuerySort<T, K extends keyof T = keyof T> = {
  [P in K]?: SortOrder;
};

export interface DataProviderOpParams<T, TTxn = unknown> {
  txn?: TTxn;
}

export interface DataProviderQueryListParams<T, TTxn = unknown>
  extends DataProviderOpParams<T, TTxn> {
  /** zero-based index */
  page?: number;
  pageSize?: number;
  projection?: ProjectionType<T>;
  sort?: DataQuerySort<T>;
}

export type DataProviderQueryParams<T, TTxn = unknown> = Pick<
  DataProviderQueryListParams<T, TTxn>,
  'projection' | 'txn'
>;

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
  QueryType extends DataQuery<DataType> = DataQuery<DataType>,
  TTxn = unknown
> {
  insertItem: (
    item: DataType,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<DataType>;
  insertList: (
    items: DataType[],
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<void>;
  existsByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<boolean>;
  getManyByQuery: (
    query: QueryType,
    otherProps?: DataProviderQueryListParams<DataType, TTxn>
  ) => Promise<DataType[]>;
  getManyByQueryList: (
    query: QueryType[],
    otherProps?: DataProviderQueryListParams<DataType, TTxn>
  ) => Promise<DataType[]>;
  getOneByQuery: (
    query: QueryType,
    otherProps?: DataProviderQueryParams<DataType, TTxn>
  ) => Promise<DataType | null>;
  assertGetOneByQuery: (
    query: QueryType,
    otherProps?: DataProviderQueryParams<DataType, TTxn>
  ) => Promise<DataType>;
  assertGetAndUpdateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: DataProviderQueryParams<DataType, TTxn>
  ) => Promise<DataType>;
  countByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<number>;
  countByQueryList: (
    query: QueryType[],
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<number>;
  updateManyByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<void>;
  updateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<void>;
  getAndUpdateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: DataProviderQueryParams<DataType, TTxn>
  ) => Promise<DataType | null>;
  deleteManyByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<void>;
  deleteManyByQueryList: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType[],
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<void>;
  deleteOneByQuery: <ExtendedQueryType extends QueryType = QueryType>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ) => Promise<void>;
  bulkWrite(
    ops: Array<BulkOpItem<DataType>>,
    otherProps?: DataProviderOpParams<DataType, TTxn>
  ): Promise<void>;
}

export interface DataProviderUtils<TTxn> {
  withTxn<TResult>(
    ctx: BaseContextType,
    fn: AnyFn<[txn: TTxn], Promise<TResult>>
  ): Promise<TResult>;
}

export type AgentTokenQuery = DataQuery<AgentToken>;
export type AppRuntimeStateQuery = DataQuery<AppRuntimeState>;
export type AssignedItemQuery<T extends AnyObject = AnyObject> = DataQuery<AssignedItem<T>>;
export type CollaborationRequestQuery = DataQuery<CollaborationRequest>;
export type FileQuery = DataQuery<File>;
export type FolderQuery = DataQuery<Folder>;
export type PermissionGroupQuery = DataQuery<PermissionGroup>;
export type PermissionItemQuery = DataQuery<PermissionItem>;
export type TagQuery = DataQuery<Tag>;
export type UsageRecordQuery = DataQuery<UsageRecord>;
export type UserQuery = DataQuery<User>;
export type WorkspaceQuery = DataQuery<Workspace>;

export type AgentTokenDataProvider = BaseDataProvider<AgentToken>;
export type AppRuntimeStateDataProvider = BaseDataProvider<AppRuntimeState>;
export type AssignedItemDataProvider = BaseDataProvider<AssignedItem>;
export type CollaborationRequestDataProvider = BaseDataProvider<CollaborationRequest>;
export type FileDataProvider = BaseDataProvider<File>;
export type FolderDataProvider = BaseDataProvider<Folder>;
export type PermissionGroupDataProvider = BaseDataProvider<PermissionGroup>;
export type PermissionItemDataProvider = BaseDataProvider<PermissionItem>;
export type TagDataProvider = BaseDataProvider<Tag>;
export type UsageRecordDataProvider = BaseDataProvider<UsageRecord>;
export type UserDataProvider = BaseDataProvider<User>;
export type WorkspaceDataProvider = BaseDataProvider<Workspace>;
export type ResourceDataProvider = BaseDataProvider<ResourceWrapper>;
export type JobDataProvider = BaseDataProvider<Job>;
