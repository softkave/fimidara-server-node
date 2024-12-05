import {describe, expect, test} from 'vitest';
import {MemoryDSetProvider} from '../MemoryDSetProvider.js';

describe('MemoryDSetProvider', () => {
  test('add', async () => {
    const dset = new MemoryDSetProvider();
    await dset.add('test', ['a', 'b', 'c']);
    expect(await dset.getAll('test')).toEqual(['a', 'b', 'c']);
  });

  test('delete, value', async () => {
    const dset = new MemoryDSetProvider();
    await dset.add('test', ['a', 'b', 'c']);
    await dset.delete('test', ['a']);
    expect(await dset.getAll('test')).toEqual(['b', 'c']);
  });

  test('delete, key', async () => {
    const dset = new MemoryDSetProvider();
    await dset.add('test', ['a', 'b', 'c']);
    await dset.delete('test');
    expect(await dset.getAll('test')).toEqual([]);
  });

  test('has', async () => {
    const dset = new MemoryDSetProvider();
    await dset.add('test', ['a', 'b', 'c']);
    expect(await dset.has('test', 'a')).toBe(true);
    expect(await dset.has('test', 'd')).toBe(false);
  });

  test('size', async () => {
    const dset = new MemoryDSetProvider();
    await dset.add('test', ['a', 'b', 'c']);
    expect(await dset.size('test')).toBe(3);
  });

  test('scan', async () => {
    const dset = new MemoryDSetProvider();
    await dset.add('test', ['a', 'b', 'c']);
    expect(await dset.scan('test', {size: 2})).toEqual({
      values: ['a', 'b'],
      cursor: 2,
      done: false,
    });
    expect(await dset.scan('test', {size: 2, cursor: 2})).toEqual({
      values: ['c'],
      cursor: 0,
      done: true,
    });
  });

  test('getAll', async () => {
    const dset = new MemoryDSetProvider();
    await dset.add('test', ['a', 'b', 'c']);
    expect(await dset.getAll('test')).toEqual(['a', 'b', 'c']);
  });
});
