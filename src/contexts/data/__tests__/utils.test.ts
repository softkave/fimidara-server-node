import {first} from 'lodash-es';
import {describe, expect, test} from 'vitest';
import {DataQuery} from '../types.js';
import {
  BaseMongoTestData,
  generateBaseMongoTestDataFromCombination,
  generateBaseMongoTestQueryFromCombination,
  getArrTokenCountAndIndices,
  kBaseMongoTestConsts,
} from './testUtils.js';
import {CombinationToken, combineTokens} from 'softkave-js-utils';

export function testCombinations(
  tokens: CombinationToken[],
  max: number,
  expArrCount: number
) {
  const combinations = combineTokens(tokens, max);

  const {count, indices} = getArrTokenCountAndIndices(combinations);
  expect(first(combinations)).toBe(kBaseMongoTestConsts.objToken.token);
  expect(count).toBeLessThanOrEqual(expArrCount);
  expect(combinations.length).toBe(max);
  indices.forEach(index => {
    if (index !== combinations.length - 1) {
      expect(combinations[index + 1]).toBe(kBaseMongoTestConsts.objToken.token);
    }
  });
}

describe('BaseMongoDataProvider, test utils', () => {
  test('generates right combinations', () => {
    testCombinations(
      kBaseMongoTestConsts.tokensArrDepth01,
      kBaseMongoTestConsts.max,
      kBaseMongoTestConsts.maxArrTokenCount01
    );
    testCombinations(
      kBaseMongoTestConsts.tokensArrDepth02,
      kBaseMongoTestConsts.max,
      kBaseMongoTestConsts.maxArrTokenCount02
    );
    testCombinations(
      kBaseMongoTestConsts.tokensArrDepth03,
      kBaseMongoTestConsts.max,
      kBaseMongoTestConsts.maxArrTokenCount03
    );
  });

  test('generateDataFromCombination', () => {
    const combination01 = [
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
    ];
    const combination02 = [
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
      kBaseMongoTestConsts.objToken.token,
    ];

    const data01 = generateBaseMongoTestDataFromCombination(combination01);
    const data02 = generateBaseMongoTestDataFromCombination(combination02);

    const expectedData01: BaseMongoTestData = {
      str: kBaseMongoTestConsts.str01,
      num: kBaseMongoTestConsts.num01,
      arrObj: [
        {
          str: kBaseMongoTestConsts.str01,
          num: kBaseMongoTestConsts.num01,
          obj: {
            str: kBaseMongoTestConsts.str01,
            num: kBaseMongoTestConsts.num01,
            arrPrimitive: [
              kBaseMongoTestConsts.str01,
              kBaseMongoTestConsts.str01,
            ],
          },
        },
        {
          str: kBaseMongoTestConsts.str01,
          num: kBaseMongoTestConsts.num01,
        },
      ],
    };
    const exp02: BaseMongoTestData = {
      str: 'str01',
      num: 1,
      obj: {
        str: 'str01',
        num: 1,
        arrObj: [
          {
            str: 'str01',
            num: 1,
            obj: {
              str: 'str01',
              num: 1,
              obj: {
                str: 'str01',
                num: 1,
                arrObj: [
                  {str: 'str01', num: 1, obj: {str: 'str01', num: 1}},
                  {str: 'str01', num: 1},
                ],
              },
            },
          },
          {str: 'str01', num: 1},
        ],
      },
    };

    expect(data01).toMatchObject(expectedData01);
    expect(data02).toMatchObject(exp02);
  });

  test('generateTestQueryFromCombination', () => {
    const combination01 = [
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
    ];
    const combination02 = [
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.objToken.token,
      kBaseMongoTestConsts.arrToken.token,
      kBaseMongoTestConsts.objToken.token,
    ];

    const query01 = generateBaseMongoTestQueryFromCombination({
      combinations: combination01,
      primitiveOp: '$eq',
      elemOp: '$elemMatch',
    });
    const query02 = generateBaseMongoTestQueryFromCombination({
      combinations: combination01,
      primitiveOp: '$eq',
      elemOp: '$objMatch',
    });
    const query03 = generateBaseMongoTestQueryFromCombination({
      combinations: combination01,
      primitiveOp: '$all',
      elemOp: '$all',
    });
    const query04 = generateBaseMongoTestQueryFromCombination({
      combinations: combination02,
      elemOp: '$elemMatch',
    });
    const query05 = generateBaseMongoTestQueryFromCombination({
      combinations: combination02,
      elemOp: '$all',
    });

    const expectedQuery01: DataQuery<BaseMongoTestData> = {
      str: kBaseMongoTestConsts.str01,
      num: kBaseMongoTestConsts.num01,
      arrObj: {
        $elemMatch: {
          str: kBaseMongoTestConsts.str01,
          num: kBaseMongoTestConsts.num01,
          obj: {
            $objMatch: {
              str: kBaseMongoTestConsts.str01,
              num: kBaseMongoTestConsts.num01,
              arrPrimitive: kBaseMongoTestConsts.str01,
            },
          },
        },
      },
    };
    const expectedQuery02: DataQuery<BaseMongoTestData> = {
      str: kBaseMongoTestConsts.str01,
      num: kBaseMongoTestConsts.num01,
      arrObj: {
        $objMatch: {
          str: kBaseMongoTestConsts.str01,
          num: kBaseMongoTestConsts.num01,
          obj: {
            $objMatch: {
              str: kBaseMongoTestConsts.str01,
              num: kBaseMongoTestConsts.num01,
              arrPrimitive: kBaseMongoTestConsts.str01,
            },
          },
        },
      },
    };
    const expectedQuery03: DataQuery<BaseMongoTestData> = {
      str: kBaseMongoTestConsts.str01,
      num: kBaseMongoTestConsts.num01,
      arrObj: {
        $all: [
          {
            $elemMatch: {
              str: kBaseMongoTestConsts.str01,
              num: kBaseMongoTestConsts.num01,
              obj: {
                $objMatch: {
                  str: kBaseMongoTestConsts.str01,
                  num: kBaseMongoTestConsts.num01,
                  arrPrimitive: {
                    $all: [
                      kBaseMongoTestConsts.str01,
                      kBaseMongoTestConsts.str01,
                    ],
                  },
                },
              },
            },
          },
          {
            $elemMatch: {
              str: kBaseMongoTestConsts.str01,
              num: kBaseMongoTestConsts.num01,
            },
          },
        ],
      },
    };
    const expectedQuery04: DataQuery<BaseMongoTestData> = {
      str: kBaseMongoTestConsts.str01,
      num: kBaseMongoTestConsts.num01,
      obj: {
        $objMatch: {
          str: kBaseMongoTestConsts.str01,
          num: kBaseMongoTestConsts.num01,
          arrObj: {
            $elemMatch: {
              str: kBaseMongoTestConsts.str01,
              num: kBaseMongoTestConsts.num01,
              obj: {
                $objMatch: {
                  str: kBaseMongoTestConsts.str01,
                  num: kBaseMongoTestConsts.num01,
                  obj: {
                    $objMatch: {
                      str: kBaseMongoTestConsts.str01,
                      num: kBaseMongoTestConsts.num01,
                      arrObj: {
                        $elemMatch: {
                          str: kBaseMongoTestConsts.str01,
                          num: kBaseMongoTestConsts.num01,
                          obj: {
                            $objMatch: {
                              str: kBaseMongoTestConsts.str01,
                              num: kBaseMongoTestConsts.num01,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const expectedQuery05: DataQuery<BaseMongoTestData> = {
      str: kBaseMongoTestConsts.str01,
      num: kBaseMongoTestConsts.num01,
      obj: {
        $objMatch: {
          str: kBaseMongoTestConsts.str01,
          num: kBaseMongoTestConsts.num01,
          arrObj: {
            $all: [
              {
                $elemMatch: {
                  str: kBaseMongoTestConsts.str01,
                  num: kBaseMongoTestConsts.num01,
                  obj: {
                    $objMatch: {
                      str: kBaseMongoTestConsts.str01,
                      num: kBaseMongoTestConsts.num01,
                      obj: {
                        $objMatch: {
                          str: kBaseMongoTestConsts.str01,
                          num: kBaseMongoTestConsts.num01,
                          arrObj: {
                            $all: [
                              {
                                $elemMatch: {
                                  str: kBaseMongoTestConsts.str01,
                                  num: kBaseMongoTestConsts.num01,
                                  obj: {
                                    $objMatch: {
                                      str: kBaseMongoTestConsts.str01,
                                      num: kBaseMongoTestConsts.num01,
                                    },
                                  },
                                },
                              },
                              {
                                $elemMatch: {
                                  str: kBaseMongoTestConsts.str01,
                                  num: kBaseMongoTestConsts.num01,
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                $elemMatch: {
                  str: kBaseMongoTestConsts.str01,
                  num: kBaseMongoTestConsts.num01,
                },
              },
            ],
          },
        },
      },
    };

    expect(query01).toMatchObject(expectedQuery01);
    expect(query02).toMatchObject(expectedQuery02);
    expect(query03).toMatchObject(expectedQuery03);
    expect(query04).toMatchObject(expectedQuery04);
    expect(query05).toMatchObject(expectedQuery05);
  });
});
