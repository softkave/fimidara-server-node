import {
  first,
  isArray,
  isObject,
  isObjectLike,
  isUndefined,
  merge,
  set,
} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {appAssert} from '../../utils/assertion.js';
import {DataQuery} from './types.js';

export function dataQueryToMongoQuery<TQuery extends DataQuery<AnyObject>>(
  query: TQuery
) {
  const mongoQuery: AnyObject = {};

  for (const k00 in query) {
    const v00 = query[k00 as keyof TQuery];

    if (isUndefined(v00)) {
      continue;
    }

    if (typeof v00 !== 'object' || v00 === null) {
      mongoQuery[k00] = v00;
      continue;
    }

    if (k00 === '$and' || k00 === '$nor' || k00 === '$or') {
      appAssert(isArray(v00));
      const qList = v00.map((v01: AnyObject) => dataQueryToMongoQuery(v01));
      mongoQuery[k00] = qList;
      continue;
    }

    Object.entries(v00).forEach(([k01, v01]) => {
      switch (k01) {
        case '$objMatch': {
          appAssert(isObject(v01));
          const q01 = dataQueryToMongoQuery(v01);
          Object.entries(q01).forEach(([k02, v02]) => {
            const k03 = `${k00}.${k02}`;
            mongoQuery[k03] = v02;
          });
          break;
        }

        case '$all': {
          appAssert(isArray(v01));
          const v0100 = first(v01);

          if (isObjectLike(v0100) && v0100.$elemMatch) {
            const expQueryList = v01.map(v01Next => ({
              $elemMatch: dataQueryToMongoQuery(v01Next.$elemMatch),
            }));
            const k02 = [k00, '$all'];
            set(mongoQuery, k02, expQueryList);
          } else {
            const k02 = [k00, '$all'];
            set(mongoQuery, k02, v01);
          }

          break;
        }

        case '$elemMatch': {
          appAssert(isObject(v01));
          const q01 = dataQueryToMongoQuery(v01);
          const k02 = [k00, '$elemMatch'];
          set(mongoQuery, k02, q01);
          break;
        }

        case '$not': {
          appAssert(isObject(v01));

          if ((v01 as AnyObject).$objMatch) {
            const objMatch = (v01 as AnyObject).$objMatch;
            appAssert(isObject(objMatch));
            const q01 = dataQueryToMongoQuery(objMatch);
            Object.entries(q01).forEach(([k02, v02]) => {
              const k03 = `${k00}.${k02}`;
              mongoQuery[k03] = merge(mongoQuery[k03] || {}, {$not: v02});
            });
          } else {
            const q01 = dataQueryToMongoQuery(v01);
            const k02 = [k00, '$not'];
            set(mongoQuery, k02, q01);
          }

          break;
        }

        default: {
          const k02 = [k00, k01];
          set(mongoQuery, k02, v01);
        }
      }
    });
  }

  return mongoQuery as TQuery;
}
