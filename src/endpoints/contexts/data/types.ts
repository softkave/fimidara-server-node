import {ProjectionType, SortOrder} from 'mongoose';
import {IAgentToken} from '../../../definitions/agentToken';
import {IAssignedItem} from '../../../definitions/assignedItem';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAppRuntimeState, IResourceBase} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
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

// TODO: reclassify ops based on Mongo ops, but split comparison into number and
// other literals
export interface IComparisonLiteralFieldQueryOps<T = DataProviderLiteralType> {
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
export interface INumberLiteralFieldQueryOps {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
}

export type ILiteralFieldQueryOps<T = DataProviderLiteralType> = T extends Array<infer V>
  ? ILiteralFieldQueryOps<V> | IComparisonLiteralFieldQueryOps<T>
  : (IComparisonLiteralFieldQueryOps<T> & INumberLiteralFieldQueryOps) | T | null;

export type LiteralDataQuery<T> = {
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
  // | {type: BulkOpType.ReplaceOne,
  //     replaceOne: {query: DataQuery<T>; item: T};
  //   }
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
  updateOneByQuery: (
    query: QueryType,
    data: Partial<DataType>,
    otherProps?: IDataProviderQueryParams<DataType>
  ) => Promise<void>;
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

export type IAgentTokenQuery = DataQuery<IAgentToken>;
export type IAgentTokenDataProvider = IBaseDataProvider<IAgentToken>;
export type IAppRuntimeStateQuery = DataQuery<IAppRuntimeState>;
export type IAppRuntimeStateDataProvider = IBaseDataProvider<IAppRuntimeState>;
export type IAssignedItemQuery<T extends AnyObject = AnyObject> = DataQuery<IAssignedItem<T>>;
export type IAssignedItemDataProvider = IBaseDataProvider<IAssignedItem>;
export type ICollaborationRequestQuery = DataQuery<ICollaborationRequest>;
export type ICollaborationRequestDataProvider = IBaseDataProvider<ICollaborationRequest>;
export type IFileQuery = DataQuery<IFile>;
export type IFileDataProvider = IBaseDataProvider<IFile>;
export type IFolderQuery = DataQuery<IFolder>;
export type IFolderDataProvider = IBaseDataProvider<IFolder>;
export type IPermissionGroupQuery = DataQuery<IPermissionGroup>;
export type IPermissionGroupDataProvider = IBaseDataProvider<IPermissionGroup>;
export type IPermissionItemQuery = DataQuery<IPermissionItem>;
export type IPermissionItemDataProvider = IBaseDataProvider<IPermissionItem>;
export type ITagQuery = DataQuery<ITag>;
export type ITagDataProvider = IBaseDataProvider<ITag>;
export type IUsageRecordQuery = DataQuery<IUsageRecord>;
export type IUsageRecordDataProvider = IBaseDataProvider<IUsageRecord>;
export type IUserQuery = DataQuery<IUser>;
export type IUserDataProvider = IBaseDataProvider<IUser>;
export type IWorkspaceQuery = DataQuery<IWorkspace>;
export type IWorkspaceDataProvider = IBaseDataProvider<IWorkspace>;
export type IResourceDataProvider = IBaseDataProvider<IResourceBase>;
