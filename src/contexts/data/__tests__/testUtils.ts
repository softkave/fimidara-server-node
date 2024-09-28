import {compact, last, range, set} from 'lodash-es';
import {AnyObject, CombinationToken, loopAndCollate} from 'softkave-js-utils';
import {DataQuery} from '../types.js';

const kArrChar = 'A';
const kObjChar = 'O';
const kMaxArrTokenCount01 = 1;
const kMaxArrTokenCount02 = 2;
const kMaxArrTokenCount03 = 3;
const kMax = 10;
const kObjToken: CombinationToken = {
  token: kObjChar,
  filterFn() {
    return true;
  },
};
const kArrToken: CombinationToken = {
  token: kArrChar,
  filterFn() {
    return false;
  },
};

function makeArrFilterFn(max: number) {
  return (index: number, spent: number, generated: string[]) => {
    return index !== 0 && spent < max && last(generated) !== kArrChar;
  };
}

export function getArrTokenCountAndIndices(tokens: string[]) {
  let count = 0;
  const indices: number[] = [];

  tokens.forEach((token, index) => {
    if (token === kArrToken.token) {
      count += 1;
      indices.push(index);
    }
  });

  return {count, indices};
}

export interface BaseMongoTestData {
  str: string;
  num: number;
  arrObj?: BaseMongoTestData[];
  arrPrimitive?: string[];
  obj?: BaseMongoTestData;
}

const num01 = 1;
const str01 = 'str01';

export function generateTestData(
  seed: Partial<BaseMongoTestData> = {}
): BaseMongoTestData {
  return {
    str: str01,
    num: num01,
    ...seed,
  };
}

export function generateTestDataQuery(
  seed: Partial<DataQuery<BaseMongoTestData>> = {}
): DataQuery<BaseMongoTestData> {
  return {
    str: str01,
    num: num01,
    ...seed,
  };
}

export function generateBaseMongoTestDataFromCombination(
  combinations: string[],
  arrItemsCount = 2
) {
  let data: AnyObject = {};
  let prevPath: Array<string | number> = [];

  combinations.forEach((token, index) => {
    let key: Array<string | number> = [];

    if (token === kObjToken.token) {
      const tData = generateTestData();

      if (index > 0) {
        key = prevPath.concat('obj');
      }

      if (key.length === 0) {
        data = tData;
      } else {
        set(data, key, tData);
      }

      prevPath = key;
    } else if (token === kArrToken.token) {
      if (index < 1) {
        return;
      }

      const isPrimitive = index === combinations.length - 1;

      if (isPrimitive) {
        key = prevPath.concat('arrPrimitive');
      } else {
        key = prevPath.concat('arrObj');
      }

      range(arrItemsCount).forEach(itemIndex => {
        const arrItemKey = key.concat(itemIndex);
        const arrItemData = isPrimitive ? str01 : generateTestData();
        set(data, arrItemKey, arrItemData);
      });
      prevPath = key.concat(0);
    }
  });

  return data;
}

export function generateBaseMongoTestQueryFromCombination(props: {
  combinations: string[];
  primitiveOp?: '$eq' | '$all';
  elemOp?: '$elemMatch' | '$all' | '$objMatch';
  arrItemsCount?: number;
}) {
  const {
    combinations,
    primitiveOp = '$eq',
    elemOp = '$elemMatch',
    arrItemsCount = 2,
  } = props;
  let query: AnyObject = {};
  let prevPath: Array<string | number> = [];

  combinations.forEach((token, index) => {
    let key: Array<string | number> = [];

    if (token === kObjToken.token) {
      const tData = generateTestDataQuery();

      if (index > 0) {
        key = prevPath.concat('obj', '$objMatch');
      }

      if (key.length === 0) {
        query = tData;
      } else {
        set(query, key, tData);
      }

      prevPath = key;
    } else if (token === kArrToken.token) {
      if (index < 1) {
        return;
      }

      const isPrimitive = index === combinations.length - 1;
      let tData: unknown;

      if (isPrimitive) {
        key = prevPath.concat(
          compact(['arrPrimitive', primitiveOp === '$all' ? '$all' : undefined])
        );
        tData =
          primitiveOp === '$eq'
            ? str01
            : loopAndCollate(() => str01, arrItemsCount);
        set(query, key, tData);
      } else {
        key = prevPath.concat(['arrObj', elemOp]);

        if (elemOp === '$all') {
          range(arrItemsCount).forEach(itemIndex => {
            const arrItemKey = key.concat(itemIndex);
            const arrItemData = isPrimitive ? str01 : generateTestDataQuery();
            set(query, arrItemKey.concat('$elemMatch'), arrItemData);
          });
        } else {
          set(query, key, generateTestDataQuery());
        }

        prevPath = key.concat(elemOp === '$all' ? [0, '$elemMatch'] : []);
      }
    }
  });

  return query;
}

export const kBaseMongoTestConsts = {
  num01,
  str01,
  maxArrTokenCount01: kMaxArrTokenCount01,
  maxArrTokenCount02: kMaxArrTokenCount02,
  maxArrTokenCount03: kMaxArrTokenCount03,
  max: kMax,
  objToken: kObjToken,
  arrToken: kArrToken,
  tokensArrDepth01: [
    kObjToken,
    {...kArrToken, filterFn: makeArrFilterFn(kMaxArrTokenCount01)},
  ],
  tokensArrDepth02: [
    kObjToken,
    {...kArrToken, filterFn: makeArrFilterFn(kMaxArrTokenCount02)},
  ],
  tokensArrDepth03: [
    kObjToken,
    {...kArrToken, filterFn: makeArrFilterFn(kMaxArrTokenCount03)},
  ],
};
