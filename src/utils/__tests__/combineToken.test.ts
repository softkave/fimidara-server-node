import {last} from 'lodash-es';
import {describe, expect, test} from 'vitest';
import {CombinationToken, combineTokens} from '../combineTokens.js';

describe('combineTokens', () => {
  test('generates within tokens', () => {
    const t01 = 't01';
    const t02 = 't02';
    const t03 = 't03';
    const max = 6;
    const token01: CombinationToken = {token: t01};
    const token02: CombinationToken = {token: t02};
    const token03: CombinationToken = {token: t03};

    const result = combineTokens([token01, token02, token03], max);

    const expectedTokens = [t01, t02, t03];
    result.forEach(token => {
      expect(expectedTokens).toContainEqual(token);
    });
  });

  test('uses filterFn using spent', () => {
    const t01 = 't01';
    const t02 = 't02';
    const t03 = 't03';
    const max = 6;
    const token01: CombinationToken = {
      token: t01,
      filterFn(index, spent) {
        return spent < 1;
      },
    };
    const token02: CombinationToken = {
      token: t02,
      filterFn(index, spent) {
        return spent < 2;
      },
    };
    const token03: CombinationToken = {
      token: t03,
      filterFn(index, spent) {
        return spent < 3;
      },
    };

    const result = combineTokens([token01, token02, token03], max);

    const resultTokenCountRecord = result.reduce(
      (acc, token) => {
        acc[token] = (acc[token] || 0) + 1;
        return acc;
      },
      {} as Record<string, number | undefined>
    );
    const expectedTokenCounts = {
      [t01]: 1,
      [t02]: 2,
      [t03]: 3,
    };
    expect(resultTokenCountRecord).toMatchObject(expectedTokenCounts);
  });

  test('uses filterFn using generated', () => {
    const t01 = 't01';
    const t02 = 't02';
    const t03 = 't03';
    const max = 3;
    const token01: CombinationToken = {
      token: t01,
      filterFn(index, spent, generated) {
        return last(generated) === undefined;
      },
    };
    const token02: CombinationToken = {
      token: t02,
      filterFn(index, spent, generated) {
        return last(generated) === t01;
      },
    };
    const token03: CombinationToken = {
      token: t03,
      filterFn(index, spent, generated) {
        return last(generated) === t02;
      },
    };

    const result = combineTokens([token01, token02, token03], max);

    const expectedTokens = [t01, t02, t03];
    expect(result).toMatchObject(expectedTokens);
  });

  test('uses filterFn using index', () => {
    const t01 = 't01';
    const t02 = 't02';
    const t03 = 't03';
    const max = 3;
    const token01: CombinationToken = {
      token: t01,
      filterFn(index) {
        return index === 0;
      },
    };
    const token02: CombinationToken = {
      token: t02,
      filterFn(index) {
        return index === 1;
      },
    };
    const token03: CombinationToken = {
      token: t03,
      filterFn(index) {
        return index === 2;
      },
    };

    const result = combineTokens([token01, token02, token03], max);

    const expectedTokens = [t01, t02, t03];
    expect(result).toMatchObject(expectedTokens);
  });

  test('generates count combinations ', () => {
    const t01 = 't01';
    const t02 = 't02';
    const t03 = 't03';
    const max = 6;
    const token01: CombinationToken = {token: t01};
    const token02: CombinationToken = {token: t02};
    const token03: CombinationToken = {token: t03};

    const result = combineTokens([token01, token02, token03], max);

    expect(result.length).toBe(max);
  });

  test('generates allowance combinations if less than max', () => {
    const t01 = 't01';
    const t02 = 't02';
    const t03 = 't03';
    const max = 10;
    const token01: CombinationToken = {
      token: t01,
      filterFn(index, spent) {
        return spent < 1;
      },
    };
    const token02: CombinationToken = {
      token: t02,
      filterFn(index, spent) {
        return spent < 1;
      },
    };
    const token03: CombinationToken = {
      token: t03,
      filterFn(index, spent) {
        return spent < 1;
      },
    };

    const result = combineTokens([token01, token02, token03], max);

    expect(result.length).toBe(3);
  });
});
