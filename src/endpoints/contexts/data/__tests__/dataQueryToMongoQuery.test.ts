import {dataQueryToMongoQuery} from '../dataQueryToMongoQuery';
import {DataQuery} from '../types';

interface TestData {
  num: number;
  str: string;
  bool: boolean;
  nullish: null;
  undefinedLike: undefined;
  arrayObj: TestData[];
  arrayObj02: Pick<TestData, 'str'>[];
  arrayObj03: Pick<TestData, 'str'>[];
  arrayPrimitive: string[];
  arrayPrimitive02: string[];
  arrayPrimitive03: string[];
  obj: TestData;
  date: number;
}

describe('dataQueryToMongoQuery', () => {
  test('ComparisonLiteralFieldQueryOps', () => {
    const regex = /[ab]/;
    const one = 1;
    const two = 2;
    const numList = [one, two];
    const bool = true;
    const date = Date.now();
    const dQuery: DataQuery<TestData> = {
      num: {$eq: two, $in: numList, $ne: one, $nin: numList, $exists: bool},
      str: {$regex: regex},
      date: date,
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      num: {$eq: two, $in: numList, $ne: one, $nin: numList, $exists: bool},
      str: {$regex: regex},
      date: date,
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('NumberLiteralFieldQueryOps', () => {
    const one = 1;
    const dQuery: DataQuery<TestData> = {
      num: {$gt: one, $gte: one, $lt: one, $lte: one},
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      num: {$gt: one, $gte: one, $lt: one, $lte: one},
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('RecordFieldQueryOps', () => {
    const one = 1;
    const str01 = 'str01';
    const dQuery: DataQuery<TestData> = {
      obj: {
        $objMatch: {
          num: {$gt: one, $gte: one, $lt: one, $lte: one},
          str: {$eq: str01},
        },
      },
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      'obj.num': {$gt: one, $gte: one, $lt: one, $lte: one},
      'obj.str': {$eq: str01},
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('RecordFieldQueryOps with array', () => {
    const one = 1;
    const str01 = 'str01';
    const dQuery: DataQuery<TestData> = {
      arrayObj: {
        $objMatch: {
          num: {$gt: one, $gte: one, $lt: one, $lte: one},
          str: {$eq: str01},
          obj: {
            $objMatch: {
              num: one,
            },
          },
        },
      },
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      'arrayObj.num': {$gt: one, $gte: one, $lt: one, $lte: one},
      'arrayObj.str': {$eq: str01},
      'arrayObj.obj.num': one,
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('nested RecordFieldQueryOps, depth 2', () => {
    const one = 1;
    const str01 = 'str01';
    const dQuery: DataQuery<TestData> = {
      obj: {
        $objMatch: {
          obj: {
            $objMatch: {
              num: {$gt: one, $gte: one, $lt: one, $lte: one},
              str: {$eq: str01},
            },
          },
        },
      },
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      'obj.obj.num': {$gt: one, $gte: one, $lt: one, $lte: one},
      'obj.obj.str': {$eq: str01},
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('nested RecordFieldQueryOps, depth 3', () => {
    const one = 1;
    const str01 = 'str01';
    const dQuery: DataQuery<TestData> = {
      obj: {
        $objMatch: {
          obj: {
            $objMatch: {
              obj: {
                $objMatch: {
                  num: {$gt: one, $gte: one, $lt: one, $lte: one},
                  str: {$eq: str01},
                },
              },
            },
          },
        },
      },
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      'obj.obj.obj.num': {$gt: one, $gte: one, $lt: one, $lte: one},
      'obj.obj.obj.str': {$eq: str01},
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('ArrayFieldQueryOps primitive', () => {
    const size = 2;
    const str01 = 'str01';
    const str02 = 'str02';
    const str03 = 'str03';
    const dQuery: DataQuery<TestData> = {
      arrayPrimitive: {
        $size: size,
        $all: [str01, str02, str03],
        $eq: [str01, str02, str03],
      },
      arrayPrimitive02: {
        $eq: str01,
      },
      arrayPrimitive03: str01,
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      arrayPrimitive: {
        $size: size,
        $all: [str01, str02, str03],
        $eq: [str01, str02, str03],
      },
      arrayPrimitive02: {
        $eq: str01,
      },
      arrayPrimitive03: str01,
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('ArrayFieldQueryOps object', () => {
    const size = 2;
    const str01 = 'str01';
    const date = Date.now();
    const dQuery: DataQuery<TestData> = {
      arrayObj: {
        $size: size,
        $all: [
          {$elemMatch: {str: str01}},
          {$elemMatch: {str: {$eq: str01}}},
          {$elemMatch: {num: {$gt: size}}},
          {$elemMatch: {date: {$eq: date}}},
          {$elemMatch: {obj: {$objMatch: {str: str01}}}},
          {$elemMatch: {obj: {$not: {$objMatch: {str: str01}}}}},
        ],
        $elemMatch: {str: str01},
        $eq: null,
      },
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      arrayObj: {
        $size: size,
        $all: [
          {$elemMatch: {str: str01}},
          {$elemMatch: {str: {$eq: str01}}},
          {$elemMatch: {num: {$gt: size}}},
          {$elemMatch: {date: {$eq: date}}},
          {$elemMatch: {'obj.str': str01}},
          {$elemMatch: {'obj.str': {$not: str01}}},
        ],
        $elemMatch: {str: str01},
        $eq: null,
      },
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('FieldLogicalQueryOps', () => {
    const one = 1;
    const str01 = 'str01';
    const dQuery: DataQuery<TestData> = {
      str: {$not: {$eq: str01}},
      num: {$not: {$gt: one}},
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      str: {$not: {$eq: str01}},
      num: {$not: {$gt: one}},
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('FieldLogicalQueryOps with objMatch', () => {
    const one = 1;
    const str01 = 'str01';
    const dQuery: DataQuery<TestData> = {
      obj: {
        $not: {
          $objMatch: {
            num: {$gt: one, $gte: one, $lt: one, $lte: one},
            str: {$eq: str01},
          },
        },
      },
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      'obj.num': {$not: {$gt: one, $gte: one, $lt: one, $lte: one}},
      'obj.str': {$not: {$eq: str01}},
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('LogicalQueryOps', () => {
    const one = 1;
    const str01 = 'str01';
    const dQuery01: DataQuery<TestData> = {
      obj: {
        $not: {
          $objMatch: {
            num: {$gt: one, $gte: one, $lt: one, $lte: one},
            str: {$eq: str01},
          },
        },
      },
    };
    const dQuery02: DataQuery<TestData> = {
      num: one,
    };
    const dQuery: DataQuery<TestData> = {
      $or: [dQuery01, dQuery02],
      $nor: [dQuery01, dQuery02],
      $and: [dQuery01, dQuery02],
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery01 = {
      'obj.num': {$not: {$gt: one, $gte: one, $lt: one, $lte: one}},
      'obj.str': {$not: {$eq: str01}},
    };
    const expectedQuery02 = {
      num: one,
    };
    const expectedQuery = {
      $or: [expectedQuery01, expectedQuery02],
      $nor: [expectedQuery01, expectedQuery02],
      $and: [expectedQuery01, expectedQuery02],
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });

  test('preserves existing . separator', () => {
    const one = 1;
    const dQuery: DataQuery<TestData> = {
      // @ts-ignore
      'obj.num': {$eq: one},
    };

    const mongoQuery = dataQueryToMongoQuery(dQuery);

    const expectedQuery = {
      'obj.num': {$eq: one},
    };
    expect(mongoQuery).toMatchObject(expectedQuery);
  });
});
