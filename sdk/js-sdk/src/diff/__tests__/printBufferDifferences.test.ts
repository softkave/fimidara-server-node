import {describe, expect, it} from 'vitest';
import {printBufferDifferences} from '../printBufferDifferences.js';

describe('printBufferDifferences', () => {
  it('should return no differences for identical buffers', () => {
    const buffer1 = Buffer.from('Hello World');
    const buffer2 = Buffer.from('Hello World');

    const result = printBufferDifferences(buffer1, buffer2);
    expect(result).toEqual(
      'Buffer Differences:\n' +
        'Pos\tBuffer1\tBuffer2\tChar1\tChar2\n' +
        '---\t-------\t-------\t-----\t-----\n' +
        'No differences found.'
    );
  });

  it('should show differences between buffers of same length', () => {
    const buffer1 = Buffer.from('Hello');
    const buffer2 = Buffer.from('Hallo');

    const result = printBufferDifferences(buffer1, buffer2);
    expect(result).toEqual(
      'Buffer Differences:\n' +
        'Pos\tBuffer1\tBuffer2\tChar1\tChar2\n' +
        '---\t-------\t-------\t-----\t-----\n' +
        '1\t101\t97\te\ta'
    );
  });

  it('should handle buffers of different lengths', () => {
    const buffer1 = Buffer.from('Hi');
    const buffer2 = Buffer.from('Hello');

    const result = printBufferDifferences(buffer1, buffer2);
    expect(result).toEqual(
      'Buffer Differences:\n' +
        'Pos\tBuffer1\tBuffer2\tChar1\tChar2\n' +
        '---\t-------\t-------\t-----\t-----\n' +
        '2\tEOF\t108\t\tl\n' +
        '3\tEOF\t108\t\tl\n' +
        '4\tEOF\t111\t\to'
    );
  });

  it('should handle empty buffers', () => {
    const buffer1 = Buffer.from('');
    const buffer2 = Buffer.from('');

    const result = printBufferDifferences(buffer1, buffer2);
    expect(result).toEqual(
      'Buffer Differences:\n' +
        'Pos\tBuffer1\tBuffer2\tChar1\tChar2\n' +
        '---\t-------\t-------\t-----\t-----\n' +
        'No differences found.'
    );
  });

  it('should handle non-printable characters', () => {
    const buffer1 = Buffer.from([0x00, 0x01, 0x02]);
    const buffer2 = Buffer.from([0x00, 0x02, 0x03]);

    const result = printBufferDifferences(buffer1, buffer2);
    expect(result).toEqual(
      'Buffer Differences:\n' +
        'Pos\tBuffer1\tBuffer2\tChar1\tChar2\n' +
        '---\t-------\t-------\t-----\t-----\n' +
        '1\t1\t2\t.\t.\n' +
        '2\t2\t3\t.\t.'
    );
  });

  it('should handle Uint8Array input', () => {
    const array1 = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const array2 = new Uint8Array([72, 97, 108, 108, 111]); // "Hallo"

    const result = printBufferDifferences(array1, array2);
    expect(result).toEqual(
      'Buffer Differences:\n' +
        'Pos\tBuffer1\tBuffer2\tChar1\tChar2\n' +
        '---\t-------\t-------\t-----\t-----\n' +
        '1\t101\t97\te\ta'
    );
  });
});
