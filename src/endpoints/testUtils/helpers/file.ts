import assert from 'assert';
import {Readable} from 'stream';
import {streamToBuffer} from '../../../utils/fns';
import {kUtilsInjectables} from '../../contexts/injectables';

export async function assertFileBodyEqual(fileId: string, expectedBodyStream: Readable) {
  const savedFile = await context.fileBackend.readFile({
    bucket: kUtilsInjectables.config().S3Bucket,
    filepath: fileId,
  });
  const savedBuffer = savedFile.body && (await streamToBuffer(savedFile.body));
  const expectedBuffer = await streamToBuffer(expectedBodyStream);
  assert(savedBuffer);
  assert(expectedBuffer);
  expect(expectedBuffer.equals(savedBuffer)).toBe(true);
}
