import {isNumber, isObject, isObjectLike} from 'lodash';
import {FilterQuery, Model} from 'mongoose';
import {cast} from '../../../utils/fns';
import {AnyObject} from '../../../utils/types';
import {endpointConstants} from '../../constants';
import {
  BaseDataProvider,
  BulkOpItem,
  BulkOpType,
  ComparisonLiteralFieldQueryOps,
  DataProviderLiteralType,
  DataQuery,
  IArrayFieldQueryOps,
  IDataProvideQueryListParams,
  IRecordFieldQueryOps,
  NumberLiteralFieldQueryOps,
} from './types';

export function getMongoQueryOptionsForOne(p?: IDataProvideQueryListParams<any>) {
  return {
    lean: true,
    projection: p?.projection,
  };
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

export function getMongoQueryOptionsForMany(p?: IDataProvideQueryListParams<any>) {
  const page = getPage(p?.page);
  const pageSize = getPageSize(p?.pageSize, page);
  const skip = isNumber(page) && isNumber(pageSize) ? Math.max(page, 0) * pageSize : undefined;
  return {
    skip,
    limit: pageSize,
    lean: true,
    projection: p?.projection,
    sort: p?.sort,
  };
}

export abstract class BaseMongoDataProvider<
  T extends AnyObject,
  Q extends DataQuery<AnyObject> = DataQuery<T>
> implements BaseDataProvider<T, Q>
{
  abstract throwNotFound: () => void;
  model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  insertItem = async (item: T) => {
    const doc = new this.model(item);
    return await doc.save();
  };

  insertList = async (items: T[]) => {
    await this.model.insertMany(items);
  };

  getManyByQuery = async (q: Q, p?: IDataProvideQueryListParams<T>) => {
    const opts = getMongoQueryOptionsForMany(p);
    const mongoQuery = BaseMongoDataProvider.getMongoQuery(q);
    const items = await this.model.find(mongoQuery, p?.projection, opts).lean().exec();
    return items as unknown as T[];
  };

  getManyByQueryList = async (q: Q[], p?: IDataProvideQueryListParams<T>) => {
    const items = await this.model
      .find(
        {$or: q.map(next => BaseMongoDataProvider.getMongoQuery(next))},
        p?.projection,
        getMongoQueryOptionsForMany(p)
      )
      .lean()
      .exec();
    return items as unknown as T[];
  };

  getOneByQuery = async (q: Q, p?: IDataProvideQueryListParams<T>) => {
    const item = await this.model
      .findOne(BaseMongoDataProvider.getMongoQuery(q), p?.projection)
      .lean()
      .exec();
    return item as unknown as T | null;
  };

  assertGetOneByQuery = async (q: Q, p?: IDataProvideQueryListParams<T>) => {
    const item = await this.getOneByQuery(q, p);
    if (!item) this.throwNotFound();
    return item as unknown as T;
  };

  updateManyByQuery = async (q: Q, d: Partial<T>) => {
    await this.model.updateMany(BaseMongoDataProvider.getMongoQuery(q), d).exec();
  };

  updateOneByQuery = async (q: Q, d: Partial<T>, p?: IDataProvideQueryListParams<T>) => {
    await this.model.updateOne(BaseMongoDataProvider.getMongoQuery(q), d).exec();
  };

  getAndUpdateOneByQuery = async (q: Q, d: Partial<T>, p?: IDataProvideQueryListParams<T>) => {
    const item = await this.model
      .findOneAndUpdate(BaseMongoDataProvider.getMongoQuery(q), d, {
        ...getMongoQueryOptionsForOne(p),
        new: true,
      })
      .exec();
    return item as unknown as T;
  };

  assertGetAndUpdateOneByQuery = async (
    q: Q,
    d: Partial<T>,
    p?: IDataProvideQueryListParams<T>
  ) => {
    const item = await this.getAndUpdateOneByQuery(q, d, p);
    if (!item) this.throwNotFound();
    return item as unknown as T;
  };

  existsByQuery = async (q: Q) => {
    return !!(await this.model.exists(BaseMongoDataProvider.getMongoQuery(q)).lean().exec());
  };

  countByQuery = async (q: Q) => {
    return await this.model.countDocuments(BaseMongoDataProvider.getMongoQuery(q)).exec();
  };

  countByQueryList = async (q: Q[]) => {
    const count = await this.model
      .countDocuments({$or: q.map(next => BaseMongoDataProvider.getMongoQuery(next))})
      .exec();
    return count;
  };

  deleteManyByQuery = async (q: Q) => {
    await this.model.deleteMany(BaseMongoDataProvider.getMongoQuery(q)).exec();
  };

  deleteManyByQueryList = async (q: Q[]) => {
    await this.model
      .deleteMany({$or: q.map(next => BaseMongoDataProvider.getMongoQuery(next))})
      .exec();
  };

  deleteOneByQuery = async (q: Q) => {
    await this.model.deleteOne(BaseMongoDataProvider.getMongoQuery(q)).exec();
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
