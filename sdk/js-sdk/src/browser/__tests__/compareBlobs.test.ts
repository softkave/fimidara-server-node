import {describe, expect, it} from 'vitest';
import {compareBlobs} from '../compareBlobs.js';

describe('compareBlobs', () => {
  const createBlob = (content: string | ArrayBuffer): Blob => {
    return new Blob([content]);
  };

  it('should return true for identical blobs', async () => {
    const content = 'Hello, World!';
    const blob1 = createBlob(content);
    const blob2 = createBlob(content);

    const result = await compareBlobs(blob1, blob2);
    expect(result).toEqual({areEqual: true});
  });

  it('should return false for blobs with different sizes', async () => {
    const blob1 = createBlob('Hello');
    const blob2 = createBlob('Hello, World!');

    const result = await compareBlobs(blob1, blob2);
    expect(result).toEqual({
      areEqual: false,
      position: 5, // Length of shorter blob
      chunk1: expect.any(Uint8Array),
      chunk2: expect.any(Uint8Array),
    });
  });

  it('should return false with position of first difference', async () => {
    const blob1 = createBlob('Hello, World!');
    const blob2 = createBlob('Hello, Earth!');

    const result = await compareBlobs(blob1, blob2);
    expect(result).toEqual({
      areEqual: false,
      position: 7, // Position where 'W' differs from 'E'
      chunk1: expect.any(Uint8Array),
      chunk2: expect.any(Uint8Array),
    });
  });

  it('should handle large blobs', async () => {
    // Create blobs larger than the chunk size (8KB)
    const largeContent1 = new Uint8Array(10000).fill(65); // 'A' repeated
    const largeContent2 = new Uint8Array(10000).fill(65);
    // Make one difference at position 9000
    largeContent2[9000] = 66; // 'B'

    const blob1 = createBlob(largeContent1.buffer);
    const blob2 = createBlob(largeContent2.buffer);

    const result = await compareBlobs(blob1, blob2);
    expect(result).toEqual({
      areEqual: false,
      position: 9000,
      chunk1: expect.any(Uint8Array),
      chunk2: expect.any(Uint8Array),
    });
  });

  it('should handle empty blobs', async () => {
    const blob1 = createBlob('');
    const blob2 = createBlob('');

    const result = await compareBlobs(blob1, blob2);
    expect(result).toEqual({areEqual: true});
  });

  it('should handle binary data', async () => {
    const binaryData1 = new Uint8Array([1, 2, 3, 4, 5]);
    const binaryData2 = new Uint8Array([1, 2, 3, 4, 5]);
    const blob1 = createBlob(binaryData1.buffer);
    const blob2 = createBlob(binaryData2.buffer);

    const result = await compareBlobs(blob1, blob2);
    expect(result).toEqual({areEqual: true});
  });

  it('should detect differences in binary data', async () => {
    const binaryData1 = new Uint8Array([1, 2, 3, 4, 5]);
    const binaryData2 = new Uint8Array([1, 2, 7, 4, 5]);
    const blob1 = createBlob(binaryData1.buffer);
    const blob2 = createBlob(binaryData2.buffer);

    const result = await compareBlobs(blob1, blob2);
    expect(result).toEqual({
      areEqual: false,
      position: 2, // Position where 3 differs from 7
      chunk1: expect.any(Uint8Array),
      chunk2: expect.any(Uint8Array),
    });
  });
});
