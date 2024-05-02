import {isNumber} from 'lodash';
import {AnyObject, ClientSession, Model, ProjectionType, QueryOptions} from 'mongoose';
import {
  BaseDataProvider,
  BulkOpItem,
  BulkOpType,
  DataProviderOpParams,
  DataProviderQueryListParams,
  DataProviderQueryParams,
  DataQuery,
} from './types.js';
// eslint-disable-next-line node/no-extraneous-import
import {dataQueryToMongoQuery} from './dataQueryToMongoQuery.js';
import {getPage, getPageSize} from './utils.js';

function getMongoQueryOptionsForOp(params?: DataProviderOpParams): {
  lean: true;
  session?: ClientSession;
} {
  return {session: params?.txn as ClientSession | undefined, lean: true};
}

function getMongoBulkWriteOptions(params?: DataProviderOpParams): {
  session?: ClientSession;
} {
  return {session: params?.txn as ClientSession | undefined};
}

function getMongoQueryOptionsForOne(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: DataProviderQueryListParams<any>
): {session?: ClientSession; projection?: ProjectionType<AnyObject>} {
  return {...getMongoQueryOptionsForOp(params), projection: params?.projection};
}

function getMongoQueryOptionsForMany(
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
    const mongoQuery = dataQueryToMongoQuery(query);
    const items = await this.model
      .find(mongoQuery, otherProps?.projection, getMongoQueryOptionsForMany(otherProps))
      .lean()
      .exec();
    return items as unknown as T[];
  };

  getOneByQuery = async (
    query: TQuery,
    otherProps?: DataProviderQueryParams<T> | undefined
  ) => {
    const opts = getMongoQueryOptionsForOne(otherProps);
    const mQuery = dataQueryToMongoQuery(query);
    const item = await this.model.findOne(mQuery, opts.projection, opts).lean().exec();
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
        dataQueryToMongoQuery(query),
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
        dataQueryToMongoQuery(query),
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
      .findOneAndUpdate(dataQueryToMongoQuery(query), data, {
        ...getMongoQueryOptionsForOne(otherProps),
        new: true,
      })
      .exec();
    return item as unknown as T;
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
      .countDocuments(dataQueryToMongoQuery(query), getMongoQueryOptionsForOp(otherProps))
      .exec();
  };

  deleteManyByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .deleteMany(dataQueryToMongoQuery(query), getMongoQueryOptionsForOp(otherProps))
      .exec();
  };

  deleteOneByQuery = async <ExtendedQueryType extends TQuery = TQuery>(
    query: ExtendedQueryType,
    otherProps?: DataProviderOpParams | undefined
  ) => {
    await this.model
      .deleteOne(dataQueryToMongoQuery(query), getMongoQueryOptionsForOp(otherProps))
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
              filter: dataQueryToMongoQuery(op.query),
              update: op.update,
              upsert: op.upsert,
            },
          };
          break;

        case BulkOpType.UpdateMany:
          mongoOp = {
            updateMany: {filter: dataQueryToMongoQuery(op.query), update: op.update},
          };
          break;

        case BulkOpType.DeleteOne:
          mongoOp = {deleteOne: {filter: dataQueryToMongoQuery(op.query)}};
          break;

        case BulkOpType.DeleteMany:
          mongoOp = {deleteMany: {filter: dataQueryToMongoQuery(op.query)}};
          break;

        default: // do nothing
      }

      if (mongoOp) {
        mongoOps.push(mongoOp);
      }
    });

    await this.model.bulkWrite(mongoOps, getMongoBulkWriteOptions(otherProps));
  }
}
