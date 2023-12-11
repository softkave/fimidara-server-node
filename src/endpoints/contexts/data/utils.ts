import {isNumber, isObject, isObjectLike, isUndefined} from 'lodash';
// eslint-disable-next-line node/no-extraneous-import
import {BulkWriteOptions} from 'mongodb';
import {ClientSession, FilterQuery, Model, QueryOptions} from 'mongoose';
import {appAssert} from '../../../utils/assertion';
import {cast} from '../../../utils/fns';
import {AnyFn, AnyObject} from '../../../utils/types';
import {endpointConstants} from '../../constants';
import {kAsyncLocalStorageKeys} from '../asyncLocalStorage';
import {kUtilsInjectables} from '../injectables';
import {
  ArrayFieldQueryOps,
  BaseDataProvider,
  BulkOpItem,
  BulkOpType,
  ComparisonLiteralFieldQueryOps,
  DataProviderLiteralType,
  DataProviderOpParams,
  DataProviderQueryListParams,
  DataProviderQueryParams,
  DataProviderUtils,
  DataQuery,
  IRecordFieldQueryOps,
  NumberLiteralFieldQueryOps,
} from './types';

export function getMongoQueryOptionsForOp(params?: DataProviderOpParams): QueryOptions {
  return {session: params?.txn as ClientSession, lean: true};
}

export function getMongoBulkWriteOptions(
  params?: DataProviderOpParams
): BulkWriteOptions {
  return {session: params?.txn as ClientSession};
}

export function getMongoQueryOptionsForOne(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: DataProviderQueryListParams<any>
): QueryOptions {
  return {...getMongoQueryOptionsForOp(params), projection: params?.projection};
}

export function getPage(inputPage?: number, minPage = endpointConstants.minPage) {
  return isNumber(inputPage)
    ? Math.max(inputPage, minPage) // return 0 if page is negative
    : undefined;
}

export function getPageSize(
  inputPageSize?: number,
  inputPage?: number,
  maxPageSize = endpointConstants.maxPageSize,
  minPageSize = endpointConstants.minPageSize
) {
  const pageSize = isNumber(inputPageSize)
    ? Math.max(inputPageSize, minPageSize)
    : isNumber(inputPage)
    ? maxPageSize
    : undefined;
  if (pageSize) return Math.min(pageSize, maxPageSize);
  return pageSize;
}

export function getMongoQueryOptionsForMany(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: DataProviderQueryListParams<any>
): QueryOptions {
  const page = getPage(params?.page);
  const pageSize = getPageSize(params?.pageSize, page);
  const skip =
    isNumber(page) && isNumber(pageSize) ? Math.max(page, 0) * pageSize : undefined;
  return {
    ...getMongoQueryOptionsForOp(params),
    skip,
    limit: pageSize,
    projection: params?.projection,
    sort: params?.sort,
  };
}

export abstract class BaseMongoDataProvider<
  T extends AnyObject,
  TQuery extends DataQuery<AnyObject> = DataQuery<T>,
> implements BaseDataProvider<T, TQuery>
{
  abstract throwNotFound: () => void;
  model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  insertItem = async (item: T, otherProps?: DataProviderOpParams | undefined) => {
    await this.insertList([item], otherProps);
    return item;
  };

  insertList = async (items: T[], otherProps?: DataProviderOpParams | undefined) => {
    await this.model.insertMany(items, getMongoQueryOptionsForOp(otherProps));
  };

  getManyByQuery = async (
    query: TQuery,
    otherProps?: DataProviderQueryListParams<T> | undefined
  ) => {
    const mongoQuery = BaseMongoDataProvider.getMongoQuery(query);
    const items = await this.model
      .find(mongoQuery, otherProps?.projection, getMongoQueryOptionsForMany(otherProps))
      .lean()
      .exec();
    return items as unknown as T[];
  };

  getManyByQueryList = async (
    query: TQuery[],
    otherProps?: DataProviderQueryListParams<T> | undefined
  ) => {
    const items = await this.model
      .find(
        {$or: query.map(next => BaseMongoDataProvider.getMongoQuery(next))},
        otherProps?.projection,
        getMongoQueryOptionsForMany(otherProps)
      )
      .lean()
      .exec();
    return items as unknown as T[];
  };

  getOneByQuery = async (
    query: TQuery,
    otherProps?: DataProviderQueryParams<T> | undefined
  ) => {
    const opts = getMongoQueryOptionsForOne(otherProps);
    const item = await this.model
      .findOne(BaseMongoDataProvider.getMongoQuery(query), opts.projection, opts)
      .lean()
      .exec();
    return item as unknown as T | null;
  };

  assertGetOneByQuery = async (
    query: TQuery,
    otherProps?: DataProviderQueryParams<T> | undefined
  ) => {
    const item = await this.getOneByQuery(query, otherProps);
    if (!item) this.throwNotFound();
    return item as unknown as T;
  };

  updateManyByQuery = async (
    query: TQuery,
    data: Partial<T>,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .updateMany(
        BaseMongoDataProvider.getMongoQuery(query),
        data,
        getMongoQueryOptionsForOp(otherProps)
      )
      .exec();
  };

  updateOneByQuery = async (
    query: TQuery,
    data: Partial<T>,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .updateOne(
        BaseMongoDataProvider.getMongoQuery(query),
        data,
        getMongoQueryOptionsForOp(otherProps)
      )
      .exec();
  };

  getAndUpdateOneByQuery = async (
    query: TQuery,
    data: Partial<T>,
    otherProps?: DataProviderQueryParams<T> | undefined
  ) => {
    const item = await this.model
      .findOneAndUpdate(BaseMongoDataProvider.getMongoQuery(query), data, {
        ...getMongoQueryOptionsForOne(otherProps),
        new: true,
      })
      .exec();
    return item as unknown as T;
  };

  getAndUpdateManyByQuery = async (
    query: TQuery,
    data: Partial<T>,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .updateMany(
        BaseMongoDataProvider.getMongoQuery(query),
        data,
        getMongoQueryOptionsForOne(otherProps)
      )
      .exec();
    return this.getManyByQuery(query, otherProps);
  };

  assertGetAndUpdateOneByQuery = async (
    query: TQuery,
    data: Partial<T>,
    otherProps?: DataProviderQueryParams<T> | undefined
  ) => {
    const item = await this.getAndUpdateOneByQuery(query, data, otherProps);
    if (!item) this.throwNotFound();
    return item as unknown as T;
  };

  existsByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    return !!(await this.getOneByQuery(query, {...otherProps, projection: '_id'}));
  };

  countByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    return await this.model
      .countDocuments(
        BaseMongoDataProvider.getMongoQuery(query),
        getMongoQueryOptionsForOp(otherProps)
      )
      .exec();
  };

  countByQueryList = async (
    query: TQuery[],
    otherProps?: DataProviderOpParams | undefined
  ) => {
    const count = await this.model
      .countDocuments(
        {$or: query.map(next => BaseMongoDataProvider.getMongoQuery(next))},
        getMongoQueryOptionsForOp(otherProps)
      )
      .exec();
    return count;
  };

  deleteManyByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .deleteMany(
        BaseMongoDataProvider.getMongoQuery(query),
        getMongoQueryOptionsForOp(otherProps)
      )
      .exec();
  };

  deleteManyByQueryList = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType[],
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .deleteMany(
        {$or: query.map(next => BaseMongoDataProvider.getMongoQuery(next))},
        getMongoQueryOptionsForOp(otherProps)
      )
      .exec();
  };

  deleteOneByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .deleteOne(
        BaseMongoDataProvider.getMongoQuery(query),
        getMongoQueryOptionsForOp(otherProps)
      )
      .exec();
  };

  async bulkWrite(
    ops: BulkOpItem<T>[],
    otherProps?: DataProviderOpParams | undefined
  ): Promise<void> {
    type ModelWithTypeParameter = Model<T>;
    type MongoBulkOpsType = Parameters<ModelWithTypeParameter['bulkWrite']>[0];
    const mongoOps: MongoBulkOpsType = [];

    ops.forEach(op => {
      let mongoOp: MongoBulkOpsType[number] | null = null;

      switch (op.type) {
        case BulkOpType.InsertOne:
          mongoOp = {insertOne: {document: op.item}};
          break;

        case BulkOpType.UpdateOne:
          mongoOp = {
            updateOne: {
              filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>,
              update: op.update,
              upsert: op.upsert,
            },
          };
          break;

        case BulkOpType.UpdateMany:
          mongoOp = {
            updateMany: {
              filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>,
              update: op.update,
            },
          };
          break;

        case BulkOpType.DeleteOne:
          mongoOp = {
            deleteOne: {
              filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>,
            },
          };
          break;

        case BulkOpType.DeleteMany:
          mongoOp = {
            deleteMany: {
              filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>,
            },
          };
          break;

        default: // do nothing
      }

      if (mongoOp) {
        mongoOps.push(mongoOp);
      }
    });

    await this.model.bulkWrite(mongoOps, getMongoBulkWriteOptions(otherProps));
  }

  static getMongoQuery<
    TQuery extends DataQuery<AnyObject>,
    TData = TQuery extends DataQuery<infer U> ? U : AnyObject,
  >(query: TQuery) {
    type T = ComparisonLiteralFieldQueryOps &
      NumberLiteralFieldQueryOps &
      ArrayFieldQueryOps<never> &
      IRecordFieldQueryOps<never>;

    const mongoQuery: FilterQuery<TData> = {};

    for (const key in query) {
      const value = query[key];

      if (isQueryBaseLiteralFn(value) && !isUndefined(value)) {
        mongoQuery[key] = value;
      } else if (isObject(value)) {
        const valueOps = Object.keys(value) as Array<keyof T>;

        for (const op of valueOps) {
          switch (op) {
            case '$objMatch': {
              const valueWithObjMatch = cast<IRecordFieldQueryOps<never>>(value);
              const objMatchValue = valueWithObjMatch['$objMatch'];
              Object.keys(objMatchValue).forEach(f => {
                mongoQuery[`${key}.${f}`] = objMatchValue[f];
              });
              break;
            }
            default:
              if (!isUndefined(value)) {
                mongoQuery[key] = value;
              }
          }
        }
      }
    }

    return mongoQuery;
  }
}

export function isQueryBaseLiteralFn(query: unknown): query is DataProviderLiteralType {
  return !isObjectLike(query);
}

export class MongoDataProviderUtils implements DataProviderUtils {
  async withTxn<TResult>(
    fn: AnyFn<[txn: ClientSession], Promise<TResult>>
  ): Promise<TResult> {
    const connection = kUtilsInjectables.mongoConnection();
    const txn = kUtilsInjectables
      .asyncLocalStorage()
      .get<ClientSession>(kAsyncLocalStorageKeys.txn);
    let result: TResult | undefined = undefined;
    appAssert(connection);

    if (txn) {
      result = await fn(txn);
    } else {
      const session = await connection.startSession();
      await session.withTransaction(async () => {
        kUtilsInjectables.asyncLocalStorage().set(kAsyncLocalStorageKeys.txn, session);
        result = await fn(session);
        kUtilsInjectables.asyncLocalStorage().set(kAsyncLocalStorageKeys.txn, undefined);
      });
      await session.endSession();
    }

    // `connection.transaction` throws if error occurs so if the control flow
    // gets here, `result` is set.
    return result as unknown as TResult;
  }
}
