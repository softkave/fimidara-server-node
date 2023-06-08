import {first} from 'lodash';
import {StackedArray} from '../memArrayHelpers';

describe('StaticStackedArray without parent', () => {
  test('push', () => {
    const sArray01 = new StackedArray<number>();
    const seed = [0, 1, 2, 3, 4];
    sArray01.push(seed[0]);
    sArray01.push(seed[1]);
    expect(sArray01.length).toBe(2);
    sArray01.push([seed[2], seed[3], seed[4]]);
    expect(sArray01.length).toBe(5);
  });

  test('getLast', () => {
    const sArray01 = new StackedArray<number>();
    const seed = [0, 1, 2, 3, 4];
    sArray01.push(seed[0]);
    sArray01.push(seed[1]);
    expect(sArray01.length).toBe(2);
    sArray01.push([seed[2], seed[3], seed[4]]);
    expect(sArray01.length).toBe(5);
    expect(sArray01.getLast()).toBe(seed[4]);
  });

  test('some', () => {
    const sArray01 = new StackedArray<number>();
    const seed = [0, 1, 2, 3, 4];
    sArray01.push(seed);
    expect(sArray01.length).toBe(5);
    expect(sArray01.getLast()).toBe(seed[4]);
    sArray01.some((num, i) => {
      expect(num).toBe(seed[i]);
      return false;
    });
  });

  test('release', () => {
    const sArray01 = new StackedArray<number>();
    const seed = [0, 1, 2, 3, 4];
    sArray01.push(seed);
    expect(sArray01.length).toBe(5);
    expect(sArray01.getLast()).toBe(seed[4]);
    sArray01.some((num, i) => {
      expect(num).toBe(seed[i]);
      return false;
    });
    const {arrays, ownLength, splits} = sArray01.release();
    expect(arrays).toHaveLength(1);
    expect(first(arrays)).toEqual(expect.arrayContaining(seed));
    expect(ownLength).toBe(seed.length);
    expect(splits.length).toBe(1);
  });
});

describe('StaticStackedArray with parent', () => {
  test('push', () => {
    const sArray01 = new StackedArray<number>();
    const sArray02 = new StackedArray<number>(sArray01);
    const seed = [0, 1, 2, 3, 4];
    sArray01.push(seed[0]);
    sArray02.push(seed[1]);
    expect(sArray01.length).toBe(1);
    expect(sArray02.length).toBe(2);
    sArray01.push([seed[2]]);
    sArray02.push([seed[3], seed[4]]);
    expect(sArray01.length).toBe(2);
    expect(sArray02.length).toBe(5);
  });

  test('getLast', () => {
    const sArray01 = new StackedArray<number>();
    const sArray02 = new StackedArray<number>(sArray01);
    const seed = [0, 1, 2, 3, 4];
    sArray01.push(seed[0]);
    expect(sArray01.getLast()).toBe(seed[0]);
    expect(sArray02.getLast()).toBe(seed[0]);
    sArray02.push(seed[1]);
    expect(sArray02.getLast()).toBe(seed[1]);
    sArray01.push([seed[2]]);
    sArray02.push([seed[3], seed[4]]);
    expect(sArray01.getLast()).toBe(seed[2]);
    expect(sArray02.getLast()).toBe(seed[4]);
  });

  test('some', () => {
    const sArray01 = new StackedArray<number>();
    const sArray02 = new StackedArray<number>(sArray01);
    const seed00 = [0, 1, 2, 3, 4];
    const seed01 = [5, 6, 7, 8, 9];
    const seed02 = [10, 11, 12, 13, 14];
    sArray01.push(seed00);
    sArray02.some((num, i) => {
      expect(num).toBe(seed00[i]);
      return false;
    });
    sArray02.push(seed01);

    const some_firstPass_actual: number[] = [];
    const some_firstPass_expected = [...seed00, ...seed01];
    sArray02.some((num, i) => {
      some_firstPass_actual.push(num);
      return false;
    });
    expect(some_firstPass_actual).toEqual(expect.arrayContaining(some_firstPass_expected));

    sArray01.push(seed02);
    const some_secondPass_actual: number[] = [];
    const some_secondPass_expected = [...seed00, ...seed01, ...seed02];
    sArray02.some((num, i) => {
      some_secondPass_actual.push(num);
      return false;
    });
    expect(some_secondPass_actual).toEqual(expect.arrayContaining(some_secondPass_expected));
  });

  test('release', () => {
    const sArray01 = new StackedArray<number>();
    const sArray02 = new StackedArray<number>(sArray01);
    const seed00 = [0, 1, 2, 3, 4];
    const seed01 = [5, 6, 7, 8, 9];
    const seed02 = [10, 11, 12, 13, 14];
    const seed03 = [15, 16, 17, 18, 19];
    sArray01.push(seed00);
    sArray02.push(seed01);
    sArray01.push(seed02);
    sArray02.push(seed03);

    const {arrays, ownLength, splits} = sArray02.release();

    expect(arrays).toHaveLength(2);
    expect(arrays[0]).toEqual(expect.arrayContaining(seed01));
    expect(arrays[1]).toEqual(expect.arrayContaining(seed03));
    expect(ownLength).toBe(seed01.length + seed03.length);
    expect(splits.length).toBe(2);
  });
});
