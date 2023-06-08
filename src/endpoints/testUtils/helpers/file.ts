import assert from 'assert';
import {getBufferFromStream} from '../../contexts/file/S3FilePersistenceProviderContext';
import {BaseContextType} from '../../contexts/types';

export async function assertFileBodyEqual(
  context: BaseContextType,
  fileId: string,
  expectedBodyStream: NodeJS.ReadableStream
) {
  const savedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: fileId,
  });
  const savedBuffer = savedFile.body && (await getBufferFromStream(savedFile.body));
  const expectedBuffer = await getBufferFromStream(expectedBodyStream);
  assert(savedBuffer);
  assert(expectedBuffer);
  expect(expectedBuffer.equals(savedBuffer)).toBe(true);
}
