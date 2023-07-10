import {isNumber, isObject, isObjectLike} from 'lodash';
import {BulkWriteOptions, ClientSession} from 'mongodb';
import {FilterQuery, Model, QueryOptions} from 'mongoose';
import {appAssert} from '../../../utils/assertion';
import {cast} from '../../../utils/fns';
import {AnyFn, AnyObject} from '../../../utils/types';
import {endpointConstants} from '../../constants';
import {BaseContextType} from '../types';
import {
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
  IArrayFieldQueryOps,
  IRecordFieldQueryOps,
  NumberLiteralFieldQueryOps,
} from './types';

export function getMongoQueryOptionsForOp(
  params?: DataProviderOpParams<any, ClientSession>
): QueryOptions {
  return {session: params?.txn, lean: true};
}

export function getMongoBulkWriteOptions(
  params?: DataProviderOpParams<any, ClientSession>
): BulkWriteOptions {
  return {session: params?.txn};
}

export function getMongoQueryOptionsForOne(
  params?: DataProviderQueryListParams<any, ClientSession>
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
  params?: DataProviderQueryListParams<any, ClientSession>
): QueryOptions {
  const page = getPage(params?.page);
  const pageSize = getPageSize(params?.pageSize, page);
  const skip = isNumber(page) && isNumber(pageSize) ? Math.max(page, 0) * pageSize : undefined;
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
  TQuery extends DataQuery<AnyObject> = DataQuery<T>
> implements BaseDataProvider<T, TQuery, ClientSession>
{
  abstract throwNotFound: () => void;
  model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  insertItem = async (item: T, otherProps?: DataProviderOpParams<T, ClientSession> | undefined) => {
    const doc = new this.model(item);
    return await doc.save(getMongoQueryOptionsForOp(otherProps));
  };

  insertList = async (
    items: T[],
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
  ) => {
    await this.model.insertMany(items, getMongoQueryOptionsForOp(otherProps));
  };

  getManyByQuery = async (
    query: TQuery,
    otherProps?: DataProviderQueryListParams<T, ClientSession> | undefined
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
    otherProps?: DataProviderQueryListParams<T, ClientSession> | undefined
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
    otherProps?: DataProviderQueryParams<T, ClientSession> | undefined
  ) => {
    const item = await this.model
      .findOne(BaseMongoDataProvider.getMongoQuery(query), getMongoQueryOptionsForOne(otherProps))
      .lean()
      .exec();
    return item as unknown as T | null;
  };

  assertGetOneByQuery = async (
    query: TQuery,
    otherProps?: DataProviderQueryParams<T, ClientSession> | undefined
  ) => {
    const item = await this.getOneByQuery(query, otherProps);
    if (!item) this.throwNotFound();
    return item as unknown as T;
  };

  updateManyByQuery = async (
    query: TQuery,
    data: Partial<T>,
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
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
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
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
    otherProps?: DataProviderQueryParams<T, ClientSession> | undefined
  ) => {
    const item = await this.model
      .findOneAndUpdate(BaseMongoDataProvider.getMongoQuery(query), data, {
        ...getMongoQueryOptionsForOne(otherProps),
        new: true,
      })
      .exec();
    return item as unknown as T;
  };

  assertGetAndUpdateOneByQuery = async (
    query: TQuery,
    data: Partial<T>,
    otherProps?: DataProviderQueryParams<T, ClientSession> | undefined
  ) => {
    const item = await this.getAndUpdateOneByQuery(query, data, otherProps);
    if (!item) this.throwNotFound();
    return item as unknown as T;
  };

  existsByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
  ) => {
    return !!(await this.getOneByQuery(query, {...otherProps, projection: '_id'}));
  };

  countByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
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
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
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
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
  ) => {
    await this.model
      .deleteMany(BaseMongoDataProvider.getMongoQuery(query), getMongoQueryOptionsForOp(otherProps))
      .exec();
  };

  deleteManyByQueryList = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType[],
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
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
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
  ) => {
    await this.model
      .deleteOne(BaseMongoDataProvider.getMongoQuery(query), getMongoQueryOptionsForOp(otherProps))
      .exec();
  };

  async TRANSACTION_bulkWrite(ops: BulkOpItem<T>[]): Promise<void> {
    type Model02 = Model<T>;
    type MongoBulkOpsType = Parameters<Model02['bulkWrite']>[0];
    const mongoOps: MongoBulkOpsType = [];

    ops.forEach(op => {
      let mongoOp: MongoBulkOpsType[number] | null = null;

      switch (op.type) {
        case BulkOpType.InsertOne: {
          mongoOp = {insertOne: {document: op.item as any}};
          break;
        }
        case BulkOpType.UpdateOne: {
          mongoOp = {
            updateOne: {
              filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>,
              update: op.update,
              upsert: op.upsert,
            },
          };
          break;
        }
        case BulkOpType.UpdateMany: {
          mongoOp = {
            updateMany: {
              filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>,
              update: op.update,
            },
          };
          break;
        }
        case BulkOpType.DeleteOne: {
          mongoOp = {
            deleteOne: {filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>},
          };
          break;
        }
        case BulkOpType.DeleteMany: {
          mongoOp = {
            deleteMany: {filter: BaseMongoDataProvider.getMongoQuery(op.query) as FilterQuery<T>},
          };
          break;
        }
        default: // do nothing
      }

      if (mongoOp) {
        mongoOps.push(mongoOp);
      }
    });

    await this.model.db.transaction(async session => {
      await this.model.bulkWrite(mongoOps, {session});
    });
  }

  async bulkWrite(
    ops: BulkOpItem<T>[],
    otherProps?: DataProviderOpParams<T, ClientSession> | undefined
  ): Promise<void> {
    type ModelWithTypeParameter = Model<T>;
    type MongoBulkOpsType = Parameters<ModelWithTypeParameter['bulkWrite']>[0];
    const mongoOps: MongoBulkOpsType = [];

    ops.forEach(op => {
      let mongoOp: MongoBulkOpsType[number] | null = null;

      switch (op.type) {
        case BulkOpType.InsertOne:
          mongoOp = {insertOne: {document: op.item as any}};
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
    Q extends DataQuery<AnyObject>,
    DataType = Q extends DataQuery<infer U> ? U : AnyObject
  >(q: Q) {
    type T = ComparisonLiteralFieldQueryOps &
      NumberLiteralFieldQueryOps &
      IArrayFieldQueryOps<any> &
      IRecordFieldQueryOps<any>;
    const mq: FilterQuery<DataType> = {};
    for (const k in q) {
      const v = q[k];
      if (isQueryBaseLiteralFn(v)) mq[k] = v;
      else if (isObject(v)) {
        const vops = Object.keys(v) as Array<keyof T>;
        for (const vop of vops) {
          switch (vop) {
            case '$objMatch': {
              const vWithObjMatch = cast<IRecordFieldQueryOps<any>>(v);
              const objMatchValue = vWithObjMatch['$objMatch'];
              Object.keys(objMatchValue).forEach(f => {
                mq[`${k}.${f}`] = objMatchValue[f];
              });
              break;
            }
            default:
              mq[k] = v;
          }
        }
      }
    }
    return mq;
  }
}

export function isQueryBaseLiteralFn(q: any): q is DataProviderLiteralType {
  return !isObjectLike(q);
}

/**
 * Runs avery simple loop over the fields in the object and if any field's value
 * is not "object-like," it turns it into a `$eq` query op. If this is not the
 * behaviour you're looking for, consider updating the logic and this comment or
 * create another function.
 */
export function toDataQuery<T extends AnyObject, Q extends DataQuery<any> = DataQuery<any>>(d: T) {
  return Object.keys(d).reduce((q, k) => {
    const v = d[k];
    if (!isObjectLike(v)) q[k] = {$eq: v};
    return q;
  }, {} as AnyObject) as Q;
}

export class MongoDataProviderUtils implements DataProviderUtils<ClientSession> {
  async withTxn<TResult>(
    ctx: BaseContextType,
    fn: AnyFn<[txn: ClientSession], Promise<TResult>>
  ): Promise<TResult> {
    const connection = ctx.mongoConnection;
    let result: TResult | undefined = undefined;
    appAssert(connection);
    await connection.transaction(async session => {
      result = await fn(session);
    });

    // `connection.transaction` throws if error occurs so if the control flow
    // gets here, `result` is set.
    return result as unknown as TResult;
  }
}
