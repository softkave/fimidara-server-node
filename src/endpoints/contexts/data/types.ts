import {ProjectionType, SortOrder} from 'mongoose';
import {AgentToken} from '../../../definitions/agentToken';
import {App} from '../../../definitions/app';
import {AssignedItem} from '../../../definitions/assignedItem';
import {CollaborationRequest} from '../../../definitions/collaborationRequest';
import {File, FilePresignedPath} from '../../../definitions/file';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend';
import {Folder} from '../../../definitions/folder';
import {Job} from '../../../definitions/job';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {PermissionItem} from '../../../definitions/permissionItem';
import {AppRuntimeState, Resource, ResourceWrapper} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {User} from '../../../definitions/user';
import {Workspace} from '../../../definitions/workspace';
import {AnyFn, AnyObject} from '../../../utils/types';

export type DataQuerySort<T, K extends keyof T = keyof T> = {
  [P in K]?: SortOrder;
};

export interface DataProviderOpParams {
  txn?: unknown;
}

export interface DataProviderQueryListParams<T> extends DataProviderOpParams {
  /** zero-based index */
  page?: number;
  pageSize?: number;
  // TODO: Pick projection fields and return only projection fields in data and
  // semantic APIs
  projection?: ProjectionType<T>;
  sort?: DataQuerySort<T>;
}

export type DataProviderQueryParams<T> = Pick<
  DataProviderQueryListParams<T>,
  'projection' | 'txn'
>;

export const INCLUDE_IN_PROJECTION = 1 as const;
export const EXCLUDE_IN_PROJECTION = 0 as const;

export type DataProviderLiteralType = string | number | boolean | null | undefined | Date;

export interface ComparisonLiteralFieldQueryOps<T = DataProviderLiteralType> {
  $eq?: T | null;
  $in?: Array<T | null>;
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

export type LiteralFieldQueryOps<T = DataProviderLiteralType> =
  | (T extends DataProviderLiteralType
      ? ComparisonLiteralFieldQueryOps<T> | NumberLiteralFieldQueryOps | T
      : never)
  | null;

export type LiteralDataQuery<T> = {
  [P in keyof T]?: LiteralFieldQueryOps<T[P]>;
};

export interface IRecordFieldQueryOps<T extends AnyObject> {
  // TODO: support nested $objMatch
  $objMatch: LiteralDataQuery<T>;
}

// TODO: support $objMatch in elemMatch
type ElemMatchQueryOp<T> = T extends AnyObject
  ? LiteralDataQuery<T>
  : LiteralFieldQueryOps<T>;

export interface ArrayFieldQueryOps<T> {
  $size?: number;

  // TODO: support $objMatch and $elemMatch in $all
  $all?: T extends DataProviderLiteralType ? Array<LiteralFieldQueryOps<T>> : never;
  $elemMatch?: ElemMatchQueryOp<T>;
  $eq?: T[];
}

export type DataQuery<T> = {
  [P in keyof T]?:
    | LiteralFieldQueryOps<T[P]>
    | (NonNullable<T[P]> extends Array<infer U>
        ? ArrayFieldQueryOps<U>
        : NonNullable<T[P]> extends AnyObject
        ? IRecordFieldQueryOps<NonNullable<T[P]>>
        : never);
};

export type KeyedComparisonOps<TData extends AnyObject> = keyof TData extends string
  ? `${keyof TData}.${keyof ComparisonLiteralFieldQueryOps}`
  : '';

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
  TData,
  TQuery extends DataQuery<TData> = DataQuery<TData>,
> {
  insertItem: (item: TData, otherProps?: DataProviderOpParams) => Promise<TData>;
  insertList: (items: TData[], otherProps?: DataProviderOpParams) => Promise<void>;
  existsByQuery: <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams
  ) => Promise<boolean>;
  getManyByQuery: (
    query: TQuery,
    otherProps?: DataProviderQueryListParams<TData>
  ) => Promise<TData[]>;
  getManyByQueryList: (
    query: TQuery[],
    otherProps?: DataProviderQueryListParams<TData>
  ) => Promise<TData[]>;
  getOneByQuery: (
    query: TQuery,
    otherProps?: DataProviderQueryParams<TData>
  ) => Promise<TData | null>;
  assertGetOneByQuery: (
    query: TQuery,
    otherProps?: DataProviderQueryParams<TData>
  ) => Promise<TData>;
  assertGetAndUpdateOneByQuery: (
    query: TQuery,
    data: Partial<TData>,
    otherProps?: DataProviderQueryParams<TData>
  ) => Promise<TData>;
  countByQuery: <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams
  ) => Promise<number>;
  countByQueryList: (
    query: TQuery[],
    otherProps?: DataProviderOpParams
  ) => Promise<number>;
  updateManyByQuery: (
    query: TQuery,
    data: Partial<TData>,
    otherProps?: DataProviderOpParams
  ) => Promise<void>;
  updateOneByQuery: (
    query: TQuery,
    data: Partial<TData>,
    otherProps?: DataProviderOpParams
  ) => Promise<void>;
  getAndUpdateOneByQuery: (
    query: TQuery,
    data: Partial<TData>,
    otherProps?: DataProviderQueryParams<TData>
  ) => Promise<TData | null>;
  getAndUpdateManyByQuery: (
    query: TQuery,
    data: Partial<TData>,
    otherProps?: DataProviderOpParams
  ) => Promise<TData[]>;
  deleteManyByQuery: <TOpQuery extends TQuery = TQuery>(
    query: TOpQuery,
    otherProps?: DataProviderOpParams
  ) => Promise<void>;
  deleteManyByQueryList: <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType[],
    otherProps?: DataProviderOpParams
  ) => Promise<void>;
  deleteOneByQuery: <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams
  ) => Promise<void>;
  bulkWrite(
    ops: Array<BulkOpItem<TData>>,
    otherProps?: DataProviderOpParams
  ): Promise<void>;
}

export interface DataProviderUtils {
  withTxn<TResult>(fn: AnyFn<[txn: unknown], Promise<TResult>>): Promise<TResult>;
}

export type AgentTokenQuery = DataQuery<AgentToken>;
export type AppRuntimeStateQuery = DataQuery<AppRuntimeState>;
export type AssignedItemQuery<T extends AnyObject = AnyObject> = DataQuery<
  AssignedItem<T>
>;
export type CollaborationRequestQuery = DataQuery<CollaborationRequest>;
export type FileQuery = DataQuery<File>;
export type FilePresignedPathQuery = DataQuery<FilePresignedPath>;
export type FolderQuery = DataQuery<Folder>;
export type PermissionGroupQuery = DataQuery<PermissionGroup>;
export type PermissionItemQuery = DataQuery<PermissionItem>;
export type TagQuery = DataQuery<Tag>;
export type UsageRecordQuery = DataQuery<UsageRecord>;
export type UserQuery = DataQuery<User>;
export type WorkspaceQuery = DataQuery<Workspace>;
export type FileBackendConfigQuery = DataQuery<FileBackendConfig>;
export type FileBackendMountQuery = DataQuery<FileBackendMount>;
export type ResolvedMountEntryQuery = DataQuery<ResolvedMountEntry>;
export type AppQuery = DataQuery<App>;

export type AgentTokenDataProvider = BaseDataProvider<AgentToken, DataQuery<AgentToken>>;
export type AppRuntimeStateDataProvider = BaseDataProvider<
  AppRuntimeState,
  DataQuery<AppRuntimeState>
>;
export type AssignedItemDataProvider = BaseDataProvider<
  AssignedItem,
  DataQuery<AssignedItem>
>;
export type CollaborationRequestDataProvider = BaseDataProvider<
  CollaborationRequest,
  DataQuery<CollaborationRequest>
>;
export type FileDataProvider = BaseDataProvider<File, DataQuery<File>>;
export type FilePresignedPathDataProvider = BaseDataProvider<
  FilePresignedPath,
  DataQuery<FilePresignedPath>
>;
export type FolderDataProvider = BaseDataProvider<Folder, DataQuery<Folder>>;
export type PermissionGroupDataProvider = BaseDataProvider<
  PermissionGroup,
  DataQuery<PermissionGroup>
>;
export type PermissionItemDataProvider = BaseDataProvider<
  PermissionItem,
  DataQuery<PermissionItem>
>;
export type TagDataProvider = BaseDataProvider<Tag, DataQuery<Tag>>;
export type UsageRecordDataProvider = BaseDataProvider<
  UsageRecord,
  DataQuery<UsageRecord>
>;
export type UserDataProvider = BaseDataProvider<User, DataQuery<User>>;
export type WorkspaceDataProvider = BaseDataProvider<Workspace, DataQuery<Workspace>>;
export type ResourceDataProvider = BaseDataProvider<ResourceWrapper, DataQuery<Resource>>;
export type JobDataProvider = BaseDataProvider<Job, DataQuery<Job>>;
export type FileBackendConfigDataProvider = BaseDataProvider<
  FileBackendConfig,
  DataQuery<FileBackendConfig>
>;
export type FileBackendMountDataProvider = BaseDataProvider<
  FileBackendMount,
  DataQuery<FileBackendMount>
>;
export type ResolvedMountEntryDataProvider = BaseDataProvider<
  ResolvedMountEntry,
  DataQuery<ResolvedMountEntry>
>;
export type AppDataProvider = BaseDataProvider<App, DataQuery<App>>;
