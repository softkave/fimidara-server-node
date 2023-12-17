import assert from 'assert';
import {Readable} from 'stream';
import {streamToBuffer} from '../../../utils/fns';
import {kUtilsInjectables} from '../../contexts/injectables';

export async function expectFileBodyEqualById(
  fileId: string,
  expectedBody: Buffer | Readable
) {
  const savedFile = await context.fileBackend.readFile({
    bucket: kUtilsInjectables.config().S3Bucket,
    filepath: fileId,
  });

  expectFileBodyEqual(savedFile.body, expectedBody);
}

export async function expectFileBodyEqual(
  body: Buffer | Readable,
  expectedBody: Buffer | Readable
) {
  const [bodyBuffer, expectedBuffer] = await Promise.all([
    Buffer.isBuffer(body) ? body : streamToBuffer(body),
    Buffer.isBuffer(expectedBody) ? expectedBody : streamToBuffer(expectedBody),
  ]);

  assert(bodyBuffer);
  assert(expectedBuffer);
  expect(expectedBuffer.equals(bodyBuffer)).toBe(true);
}
