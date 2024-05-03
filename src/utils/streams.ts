import {isString} from 'lodash-es';
import {Transform, TransformCallback} from 'stream';

/**
 * A byte counter passthrough stream that works exclusively on strings and
 * Node.js buffers. It's a passthrough stream meaning it expects a reader
 * attached either through `pipe()` or `on("data")` Example:
 * ```typescript
 * import {finished} from "stream";
 *
 * const byteCounter = new ByteCounterPassThroughStream();
 * readable.pipe(byteCounter).pipe(writer);
 * await finished(readable, options);
 * const contentLength = byteCounter.contentLength;
 * ```
 */
export class ByteCounterPassThroughStream extends Transform {
  contentLength = 0;

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (isString(chunk)) {
      // TODO: preferrable unsupport string, because of the extra compute requirement, most prolly Buffer.
      this.contentLength += Buffer.byteLength(chunk, encoding);
    } else if (Buffer.isBuffer(chunk)) {
      this.contentLength += chunk.byteLength;
    } else {
      throw new Error('unsupported data type encountered');
    }

    this.push(chunk, encoding);
    callback();
  }
}
