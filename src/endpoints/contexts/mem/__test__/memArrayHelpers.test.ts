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
    expect(arrays).toEqual(expect.arrayContaining(seed));
    expect(ownLength).toBe(seed.length);
    expect(splits.length).toBe(0);
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
    sArray02.some((num, i) => {
      if (i < seed00.length) expect(num).toBe(seed00[i]);
      else expect(num).toBe(seed01[i - seed00.length]);
      return false;
    });
    sArray01.push(seed02);
    sArray02.some((num, i) => {
      if (i < seed00.length) expect(num).toBe(seed00[i]);
      else if (i < seed00.length + seed01.length) expect(num).toBe(seed01[i - seed00.length]);
      else expect(num).toBe(seed02[i - seed00.length + seed01.length]);
      return false;
    });
  });

  test('release', () => {
    const sArray01 = new StackedArray<number>();
    const sArray02 = new StackedArray<number>(sArray01);
    const seed00 = [0, 1, 2, 3, 4];
    const seed01 = [5, 6, 7, 8, 9];
    const seed02 = [10, 11, 12, 13, 14];
    sArray01.push(seed00);
    sArray02.push(seed01);
    sArray01.push(seed02);
    const {arrays, ownLength, splits} = sArray02.release();
    expect(arrays).toEqual(expect.arrayContaining(seed00.concat(seed01).concat(seed02)));
    expect(ownLength).toBe(seed00.length + seed01.length + seed02.length);
    expect(splits.length).toBe(1);
  });
});
