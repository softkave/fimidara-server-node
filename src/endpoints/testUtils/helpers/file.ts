import assert from 'assert';
import {Readable} from 'stream';
import {streamToBuffer} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';

export async function assertFileBodyEqual(
  context: BaseContextType,
  fileId: string,
  expectedBodyStream: Readable
) {
  const savedFile = await context.fileBackend.readFile({
    bucket: context.appVariables.S3Bucket,
    filepath: fileId,
  });
  const savedBuffer = savedFile.body && (await streamToBuffer(savedFile.body));
  const expectedBuffer = await streamToBuffer(expectedBodyStream);
  assert(savedBuffer);
  assert(expectedBuffer);
  expect(expectedBuffer.equals(savedBuffer)).toBe(true);
}
