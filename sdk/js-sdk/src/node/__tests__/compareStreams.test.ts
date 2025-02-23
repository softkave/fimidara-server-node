import {Readable} from 'stream';
import {describe, expect, test} from 'vitest';
import {compareStreams} from '../compareStreams.js';

describe('compareStreams', () => {
  test('returns true for identical streams', async () => {
    const data = 'Hello, World!';
    const stream1 = Readable.from(Buffer.from(data));
    const stream2 = Readable.from(Buffer.from(data));

    const result = await compareStreams(stream1, stream2);
    expect(result.areEqual).toBe(true);
  });

  test('returns false for different streams with position and chunks', async () => {
    const stream1 = Readable.from(Buffer.from('Hello, World!'));
    const stream2 = Readable.from(Buffer.from('Hello, Earth!'));

    const result = await compareStreams(stream1, stream2);
    expect(result.areEqual).toBe(false);
    expect(result.position).toBeGreaterThanOrEqual(0);
    expect(result.chunk1?.toString()).toBe('Hello, World!');
    expect(result.chunk2?.toString()).toBe('Hello, Earth!');
  });

  test('returns true for empty streams', async () => {
    const stream1 = Readable.from([]);
    const stream2 = Readable.from([]);

    const result = await compareStreams(stream1, stream2);
    expect(result.areEqual).toBe(true);
  });

  test('returns false for streams of different lengths', async () => {
    const stream1 = Readable.from(Buffer.from('Hello'));
    const stream2 = Readable.from(Buffer.from('Hello, World!'));

    const result = await compareStreams(stream1, stream2);
    expect(result.areEqual).toBe(false);
    expect(result.position).toBeGreaterThanOrEqual(0);
    expect(result.chunk1?.toString()).toBe('Hello');
    expect(result.chunk2?.toString()).toBe('Hello, World!');
  });

  test('handles large streams', async () => {
    const largeData = Buffer.alloc(1024 * 1024, 'a'); // 1MB of 'a' characters
    const stream1 = Readable.from(largeData);
    const stream2 = Readable.from(largeData);

    const result = await compareStreams(stream1, stream2);
    expect(result.areEqual).toBe(true);
  });

  test('detects differences in large streams', async () => {
    const data1 = Buffer.alloc(1024 * 1024, 'a');
    const data2 = Buffer.alloc(1024 * 1024, 'a');
    // Modify one byte in the middle of data2
    data2[512 * 1024] = 'b'.charCodeAt(0);

    const stream1 = Readable.from(data1);
    const stream2 = Readable.from(data2);

    const result = await compareStreams(stream1, stream2);
    expect(result.areEqual).toBe(false);
    expect(result.position).toBeGreaterThanOrEqual(0);
  });
});
