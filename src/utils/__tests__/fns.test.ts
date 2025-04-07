import {faker} from '@faker-js/faker';
import assert from 'assert';
import {isArray, isNumber, isObject} from 'lodash-es';
import {describe, expect, test, vi} from 'vitest';
import {expectErrorThrown} from '../../endpoints/testHelpers/helpers/error.js';
import {
  identityArgs,
  isPathEmpty,
  loop,
  loopAndCollate,
  loopAndCollateAsync,
  loopAsync,
  multilineTextToParagraph,
  omitDeep,
  pathBasename,
  pathExt,
  pathExtract,
  pathJoin,
  pathSplit,
  waitTimeout,
} from '../fns.js';

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
    const fn = vi.fn();
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
    const fn = vi.fn().mockImplementation(identityArgs);
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
    const fn = vi.fn();
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
    const fnThrows = vi.fn().mockImplementation(() => {
      throw new Error();
    });

    await expectErrorThrown(async () => {
      await loopAsync(fnThrows, max, 'oneByOne', ...extraArgs);
    });

    expect(fnThrows).toHaveBeenCalledTimes(1);
  });

  test('loopAsync, all', async () => {
    const max = 10;
    const fn = vi.fn();
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
    const fnThrows = vi.fn().mockImplementation(async () => {
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
    const fn = vi.fn();
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
    const fnThrows = vi.fn().mockImplementation(async () => {
      await waitTimeout(0);
      throw new Error();
    });

    // Should not throw outside of function even if `fn` throws error
    await loopAsync(fnThrows, max, 'allSettled', ...extraArgs);

    expect(fnThrows).toHaveBeenCalledTimes(max);
  });

  test('loopAndCollateAsync, oneByOne', async () => {
    const max = 10;
    const fn = vi.fn().mockImplementation(identityArgs);
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
    const fnThrows = vi.fn().mockImplementation(() => {
      throw new Error();
    });

    await expectErrorThrown(async () => {
      await loopAndCollateAsync(fnThrows, max, 'oneByOne', ...extraArgs);
    });

    expect(fnThrows).toHaveBeenCalledTimes(1);
  });

  test('loopAndCollateAsync, all', async () => {
    const max = 10;
    const fn = vi.fn().mockImplementation(identityArgs);
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
    const fnThrows = vi.fn().mockImplementation(async () => {
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
    const fn = vi.fn().mockImplementation(identityArgs);
    const extraArgs = [0, 1, 2];

    const result = await loopAndCollateAsync(
      fn,
      max,
      'allSettled',
      ...extraArgs
    );

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
    const fnThrows = vi.fn().mockImplementation(async () => {
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
    const inputP1 = './/abayomi/yomi';
    const inputP2 = 'fimidara/softkave//';
    const inputP3 = ['/nigeria', 'usa/', './/'];

    const output = pathJoin(inputP1, inputP2, inputP3);

    const expectedP = '/abayomi/yomi/fimidara/softkave/nigeria/usa';
    expect(output).toBe(expectedP);
  });

  test('pathJoin with empty input', () => {
    const inputP1 = '';
    const inputP2 = '../';
    const inputP3 = '.';

    const output01 = pathJoin(inputP1, inputP1);
    const output02 = pathJoin(inputP1, inputP2);
    const output03 = pathJoin(inputP1, inputP3);

    const expectedP01 = '';
    expect(output01).toBe(expectedP01);
    expect(output02).toBe(expectedP01);
    expect(output03).toBe(expectedP01);
  });

  test('pathJoin with . and ..', () => {
    const inputP1 = '/folder01';
    const inputP2 = '.././folder02';
    const inputP3 = '.';

    const output01 = pathJoin(inputP1, inputP2, inputP3);

    const expectedP01 = '/folder02';
    expect(output01).toBe(expectedP01);
  });

  test.skip('pathJoin with C://', () => {
    const inputP1 = 'C://folder01/folder02';

    const output01 = pathJoin(inputP1);

    const expectedP01 = '/folder01/folder02';
    expect(output01).toBe(expectedP01);
  });

  test('pathSplit', () => {
    const input = '///abayomi/fimidara/yomi//softkave//';

    const output = pathSplit(input);

    const expectP = ['abayomi', 'fimidara', 'yomi', 'softkave'];
    expect(output).toEqual(expectP);
  });

  test('pathSplit with . and ..', () => {
    const input01 = '///abayomi/fimidara/yomi//softkave//.././..';
    const input02 = '.././..';

    const output01 = pathSplit(input01);
    const output02 = pathSplit(input02);

    const expectP01 = ['abayomi', 'fimidara'];
    const expectP02: string[] = [];
    expect(output01).toEqual(expectP01);
    expect(output02).toEqual(expectP02);
  });

  test.skip('pathSplit with C://', () => {
    const input = 'C://abayomi/fimidara/yomi//softkave//';

    const output = pathSplit(input);

    const expectP = ['abayomi', 'fimidara', 'yomi', 'softkave'];
    expect(output).toEqual(expectP);
  });

  test('isPathEmpty', () => {
    const emptyP01 = '.';
    const emptyP02 = './';
    const emptyP03 = '/./';
    const emptyP04 = '//.//';
    const emptyP05 = '';
    const emptyP06 = [] as string[];
    const emptyP07 = [emptyP01, emptyP02, emptyP03, emptyP04, emptyP05];

    const notEmptyP01 = 'hello';
    const notEmptyP02 = 'hello/.';
    const notEmptyP03 = './hello/.';

    const isEmptyP01 = isPathEmpty(emptyP01);
    const isEmptyP02 = isPathEmpty(emptyP02);
    const isEmptyP03 = isPathEmpty(emptyP03);
    const isEmptyP04 = isPathEmpty(emptyP04);
    const isEmptyP05 = isPathEmpty(emptyP05);
    const isEmptyP06 = isPathEmpty(emptyP06);
    const isEmptyP07 = isPathEmpty(emptyP07);

    const isNotEmptyP01 = isPathEmpty(notEmptyP01);
    const isNotEmptyP02 = isPathEmpty(notEmptyP02);
    const isNotEmptyP03 = isPathEmpty(notEmptyP03);

    expect(isEmptyP01).toBeTruthy();
    expect(isEmptyP02).toBeTruthy();
    expect(isEmptyP03).toBeTruthy();
    expect(isEmptyP04).toBeTruthy();
    expect(isEmptyP05).toBeTruthy();
    expect(isEmptyP06).toBeTruthy();
    expect(isEmptyP07).toBeTruthy();

    expect(isNotEmptyP01).toBeFalsy();
    expect(isNotEmptyP02).toBeFalsy();
    expect(isNotEmptyP03).toBeFalsy();
  });

  test('pathext', () => {
    const input01 = './name.ext';
    const input02 = './name.second-name.ext';
    const input03 = './.gitignore';

    const ext01 = pathExt(input01);
    const ext02 = pathExt(input02);
    const ext03 = pathExt(input03);

    expect(ext01).toBe('ext');
    expect(ext02).toBe('ext');
    expect(ext03).toBe('');
  });

  test('pathBasename', () => {
    const input01 = './name.ext';
    const input02 = './name.second-name.ext';
    const input03 = './.gitignore';
    const input04 = './.gitignore...ext';
    const input05 = '';
    const input06 = '.';
    const input07 = '..';

    const b01 = pathBasename(input01);
    const b02 = pathBasename(input02);
    const b03 = pathBasename(input03);
    const b04 = pathBasename(input04);
    const b05 = pathBasename(input05);
    const b06 = pathBasename(input06);
    const b07 = pathBasename(input07);

    expect(b01.basename).toBe('name');
    expect(b01.ext).toBe('ext');
    expect(b02.basename).toBe('name.second-name');
    expect(b02.ext).toBe('ext');
    expect(b03.basename).toBe('.gitignore');
    expect(b03.ext).toBe('');
    expect(b04.basename).toBe('.gitignore..');
    expect(b04.ext).toBe('ext');
    expect(b05.basename).toBe('');
    expect(b05.ext).toBe('');
    expect(b06.basename).toBe('');
    expect(b06.ext).toBe('');
    expect(b07.basename).toBe('');
    expect(b07.ext).toBe('');
  });

  test('pathExtract', () => {
    const input01 = './folder/name.ext';

    const b01 = pathExtract(input01);

    expect(b01.basename).toBe('name');
    expect(b01.namepath).toEqual(['folder', 'name']);
    expect(b01.ext).toBe('ext');
  });
});
