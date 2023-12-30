import assert from 'assert';
import {Readable} from 'stream';
import {streamToBuffer} from '../../../utils/fns';
import {kSemanticModels} from '../../contexts/injectables';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils';
import {stringifyFilenamepath} from '../../files/utils';

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

export async function expectFileBodyEqualById(
  id: string,
  expectedBody: Buffer | Readable
) {
  const file = await kSemanticModels.file().getOneById(id);
  assert(file);

  const {primaryBackend, primaryMount} = await resolveBackendsMountsAndConfigs(file);
  const {body} = await primaryBackend.readFile({
    filepath: stringifyFilenamepath(file),
    mount: primaryMount,
    workspaceId: file.workspaceId,
  });
  assert(body);

  expectFileBodyEqual(body, expectedBody);
}
