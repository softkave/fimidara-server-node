import assert from 'assert';
import {FileHandle, open, stat} from 'fs/promises';
import {isString} from 'lodash-es';
import {LockStore, waitTimeout} from 'softkave-js-utils';
import {Readable} from 'stream';
import {IMultipartUploadParams, multipartUpload} from './multipart.js';

export interface IMultipartUploadNodeParams
  extends Omit<IMultipartUploadParams, 'readFrom' | 'size'> {
  data?: string | Buffer | Readable;
  localFilepath?: string;
  size?: number;
}

export async function multipartUploadNode(params: IMultipartUploadNodeParams) {
  const {data, localFilepath, ...rest} = params;
  const lockStore = new LockStore();

  // Buffer
  const inputBuffer =
    data instanceof Buffer
      ? data
      : isString(data)
      ? Buffer.from(data)
      : undefined;

  // Readable
  let previousReadableEnd = 0;
  const inputReadable = data instanceof Readable ? data : undefined;

  // Local file
  let fileHandle: FileHandle | undefined;

  async function seekReadable(start: number) {
    assert.ok(inputReadable);
    if (inputReadable.readableEnded) {
      return;
    } else if (inputReadable.errored) {
      throw inputReadable.errored;
    }

    while (previousReadableEnd < start) {
      const remaining = start - previousReadableEnd;
      const chunk = inputReadable.read(remaining);

      if (chunk) {
        previousReadableEnd += chunk.byteLength;
      } else if (inputReadable.readableEnded) {
        break;
      } else if (inputReadable.errored) {
        throw inputReadable.errored;
      } else {
        await waitTimeout(50);
      }
    }
  }

  async function readNextBufferFromReadable(
    start: number,
    end: number,
    size: number
  ) {
    assert.ok(inputReadable);
    if (inputReadable.readableEnded) {
      return {
        size: 0,
        data: Buffer.alloc(0),
      };
    } else if (inputReadable.errored) {
      throw inputReadable.errored;
    }

    return await lockStore.run('readBufferFromReadable', async () => {
      await seekReadable(start);

      let chunks: Buffer = Buffer.alloc(0);

      while (chunks.byteLength < size) {
        const remaining = size - chunks.byteLength;
        const chunk = inputReadable.read(remaining);

        if (chunk) {
          chunks = Buffer.concat([chunks, chunk]);
          previousReadableEnd += chunk.byteLength;
        } else if (inputReadable.readableEnded) {
          break;
        } else if (inputReadable.errored) {
          throw inputReadable.errored;
        } else {
          await waitTimeout(50);
        }
      }

      return {
        size: chunks.byteLength,
        data: chunks,
      };
    });
  }

  async function readNextBufferFromBuffer(start: number, end: number) {
    assert.ok(inputBuffer);
    const blob = inputBuffer.subarray(start, end);
    const size = blob.byteLength;
    return {
      size,
      data: blob,
    };
  }

  async function readNextBufferFromLocalFile(start: number, end: number) {
    assert.ok(localFilepath);
    if (!fileHandle) {
      fileHandle = await open(localFilepath, 'r');
    }

    const fResult = await fileHandle.read(
      Buffer.alloc(end - start),
      /** buffer offset */ 0,
      /** bytes to read */ end - start,
      /** file offset */ start
    );

    return {
      size: fResult.bytesRead,
      data: fResult.buffer.subarray(0, fResult.bytesRead),
    };
  }

  async function readFrom(start: number, end: number, size: number) {
    const next = inputBuffer
      ? readNextBufferFromBuffer(start, end)
      : inputReadable
      ? readNextBufferFromReadable(start, end, size)
      : localFilepath
      ? readNextBufferFromLocalFile(start, end)
      : undefined;

    assert.ok(next, 'No input data. Please provide data or localFilepath.');
    return next;
  }

  let size = params.size;
  if (!size && inputBuffer) {
    size = inputBuffer.byteLength;
  } else if (!size && localFilepath) {
    const stats = await stat(localFilepath);
    size = stats.size;
  }

  assert.ok(
    size,
    'No size. Please provide size or data as Buffer or string, or provide localFilepath.'
  );

  const result = await multipartUpload({
    ...rest,
    readFrom,
    size,
  });

  return result;
}
