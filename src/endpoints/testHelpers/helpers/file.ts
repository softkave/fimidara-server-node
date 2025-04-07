import assert from 'assert';
import {Readable} from 'stream';
import {expect} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {streamToBuffer} from '../../../utils/fns.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {stringifyFilenamepath} from '../../files/utils.js';

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
  const file = await kIjxSemantic.file().getOneById(id);
  assert(file);

  const {primaryBackend, primaryMount} = await resolveBackendsMountsAndConfigs({
    file,
    initPrimaryBackendOnly: true,
  });

  const {body} = await primaryBackend.readFile({
    filepath: stringifyFilenamepath(file),
    fileId: file.resourceId,
    mount: primaryMount,
    workspaceId: file.workspaceId,
  });

  assert(body);
  await expectFileBodyEqual(body, expectedBody);
}
