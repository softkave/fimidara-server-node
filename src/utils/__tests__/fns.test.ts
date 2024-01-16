import {faker} from '@faker-js/faker';
import assert from 'assert';
import {isArray, isNumber, isObject} from 'lodash';
import {expectErrorThrown} from '../../endpoints/testUtils/helpers/error';
import {
  identityArgs,
  loop,
  loopAndCollate,
  loopAndCollateAsync,
  loopAsync,
  multilineTextToParagraph,
  omitDeep,
  pathJoin,
  pathSplit,
  waitTimeout,
} from '../fns';

describe('fns', () => {
  test('multilineTextToParagraph', () => {
    const startText = `
      Resource type permission is effected on. 
      Target ID or other target identifiers like folderpath 
      should be provided when using target type to limit from 
    `;
    const expectedText =
      'Resource type permission is effected on. Target ID or other target identifiers like folderpath should be provided when using target type to limit from';
    const resultText = multilineTextToParagraph(startText);
    expect(resultText).toBe(expectedText);
  });

  test('loop', () => {
    const fn = jest.fn();
    const max = 10;
    const extraArgs = [0, 1, 2];

    loop(fn, max, ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
      });
  });

  test('loopAndCollate', () => {
    const fn = jest.fn().mockImplementation(identityArgs);
    const max = 10;
    const extraArgs = [0, 1, 2];

    const result = loopAndCollate(fn, max, ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
        expect(result[index]).toEqual(fnArgs);
      });
  });

  test('loopAsync, oneByOne', async () => {
    const max = 10;
    const fn = jest.fn();
    const extraArgs = [0, 1, 2];

    await loopAsync(fn, max, 'oneByOne', ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
      });

    // There should be only 1 invocation if error is thrown
    const fnThrows = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await expectErrorThrown(async () => {
      await loopAsync(fnThrows, max, 'oneByOne', ...extraArgs);
    });

    expect(fnThrows).toHaveBeenCalledTimes(1);
  });

  test('loopAsync, all', async () => {
    const max = 10;
    const fn = jest.fn();
    const extraArgs = [0, 1, 2];

    await loopAsync(fn, max, 'all', ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
      });

    // There should be only `max` invocations even if error is thrown
    const fnThrows = jest.fn().mockImplementation(async () => {
      await waitTimeout(0);
      throw new Error();
    });

    await expectErrorThrown(async () => {
      await loopAsync(fnThrows, max, 'all', ...extraArgs);
    });

    expect(fnThrows).toHaveBeenCalledTimes(max);
  });

  test('loopAsync, allSettled', async () => {
    const max = 10;
    const fn = jest.fn();
    const extraArgs = [0, 1, 2];

    await loopAsync(fn, max, 'allSettled', ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
      });

    // There should be only `max` invocations even if error is thrown
    const fnThrows = jest.fn().mockImplementation(async () => {
      await waitTimeout(0);
      throw new Error();
    });

    // Should not throw outside of function even if `fn` throws error
    await loopAsync(fnThrows, max, 'allSettled', ...extraArgs);

    expect(fnThrows).toHaveBeenCalledTimes(max);
  });

  test('loopAndCollateAsync, oneByOne', async () => {
    const max = 10;
    const fn = jest.fn().mockImplementation(identityArgs);
    const extraArgs = [0, 1, 2];

    const result = await loopAndCollateAsync(fn, max, 'oneByOne', ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
        expect(result[index]).toEqual(fnArgs);
      });

    // There should be only 1 invocation if error is thrown
    const fnThrows = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await expectErrorThrown(async () => {
      await loopAndCollateAsync(fnThrows, max, 'oneByOne', ...extraArgs);
    });

    expect(fnThrows).toHaveBeenCalledTimes(1);
  });

  test('loopAndCollateAsync, all', async () => {
    const max = 10;
    const fn = jest.fn().mockImplementation(identityArgs);
    const extraArgs = [0, 1, 2];

    const result = await loopAndCollateAsync(fn, max, 'all', ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
        expect(result[index]).toEqual(fnArgs);
      });

    // There should be only `max` invocations even if error is thrown
    const fnThrows = jest.fn().mockImplementation(async () => {
      await waitTimeout(0);
      throw new Error();
    });

    await expectErrorThrown(async () => {
      await loopAndCollateAsync(fnThrows, max, 'all', ...extraArgs);
    });

    expect(fnThrows).toHaveBeenCalledTimes(max);
  });

  test('loopAndCollateAsync, allSettled', async () => {
    const max = 10;
    const fn = jest.fn().mockImplementation(identityArgs);
    const extraArgs = [0, 1, 2];

    const result = await loopAndCollateAsync(fn, max, 'allSettled', ...extraArgs);

    expect(fn).toHaveBeenCalledTimes(max);
    Array(max)
      .fill(0)
      .forEach((unused, index) => {
        const indexResult = result[index];
        const fnArgs = [index, ...extraArgs];
        const nthCallArgs = fn.mock.calls[index];
        expect(fnArgs).toEqual(nthCallArgs);
        assert(indexResult.status === 'fulfilled');
        expect(indexResult.value).toEqual(fnArgs);
      });

    // There should be only `max` invocations even if error is thrown
    const fnThrows = jest.fn().mockImplementation(async () => {
      await waitTimeout(0);
      throw new Error();
    });

    // Should not throw outside of function even if `fn` throws error
    const resultsWithError = await loopAndCollateAsync(
      fnThrows,
      max,
      'allSettled',
      ...extraArgs
    );

    expect(fnThrows).toHaveBeenCalledTimes(max);
    expect(resultsWithError).toHaveLength(max);
    resultsWithError.forEach((result, index) => {
      if (index === 0) {
        expect(result.status === 'fulfilled');
      } else {
        expect(result.status === 'rejected');
      }
    });
  });

  test('identityArgs', () => {
    const args = Array(2).fill(faker.number.int());

    const result = identityArgs(...args);

    expect(args).toEqual(result);
  });

  test('omitDeep', () => {
    const data = [
      {
        one: 1,
        obj: {
          two: 2,
          array: [
            {
              three: 3,
              innerObject: {
                four: 4,
              },
            },
          ],
        },
      },
    ];
    const expectedDataWithoutArrays = [
      {
        one: 1,
        obj: {
          two: 2,
        },
      },
    ];
    const expectedDataWithoutNumbers = [
      {
        obj: {
          array: [
            {
              innerObject: {},
            },
          ],
        },
      },
    ];
    const expectedDataWithoutObjects: unknown[] = [];

    const dataWithoutArrays = omitDeep(data, isArray);
    const dataWithoutObjects = omitDeep(data, isObject);
    const dataWithoutNumbers = omitDeep(data, isNumber);

    expect(dataWithoutArrays).toEqual(expectedDataWithoutArrays);
    expect(dataWithoutNumbers).toEqual(expectedDataWithoutNumbers);
    expect(dataWithoutObjects).toEqual(expectedDataWithoutObjects);
  });

  test('pathJoin', () => {
    const inputP1 = '//abayomi/yomi';
    const inputP2 = 'fimidara/softkave//';
    const inputP3 = ['/nigeria', 'usa/', '//'];

    const output = pathJoin(inputP1, inputP2, inputP3);

    const expectedP = '/abayomi/yomi/fimidara/softkave/nigeria/usa';
    expect(output).toBe(expectedP);
  });

  test('pathSplit', () => {
    const input = '///abayomi/fimidara/yomi//softkave//';

    const output = pathSplit(input);

    const expectP = ['abayomi', 'fimidara', 'yomi', 'softkave'];
    expect(output).toEqual(expect.arrayContaining(expectP));
  });
});
