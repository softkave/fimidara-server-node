import {faker} from '@faker-js/faker';
import {randomUUID} from 'crypto';
import {createReadStream, ensureFile, rm} from 'fs-extra';
import {readFile, writeFile} from 'fs/promises';
import path from 'path';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {fimidaraAddRootnameToPath, FimidaraEndpoints} from '../../indexNode.js';
import {
  generateTestSlop,
  hasTestSlop,
} from '../../testutils/generate/generateTestSlop.node.js';
import {getTestVars} from '../../testutils/utils.common.js';
import {multipartUploadNode} from '../multipartNode.js';

const kMinSlopSize = 9 * 1024 * 1024; // 9MB
const testVars = getTestVars();
const slopFilepath = path.normalize(
  process.cwd() +
    testVars.testFolderPath +
    `/slop/node-multipart-slop-${kMinSlopSize}.txt`
);
const dFolderpath = path.normalize(
  process.cwd() + testVars.testFolderPath + '/dF/node'
);
const fimidara = new FimidaraEndpoints({
  authToken: testVars.authToken,
  serverURL: testVars.serverURL,
});
let slopBuffer: Buffer | undefined;

beforeAll(async () => {
  if (!(await hasTestSlop({filepath: slopFilepath, size: kMinSlopSize}))) {
    await generateTestSlop({filepath: slopFilepath, minSize: kMinSlopSize});
  }

  slopBuffer = await readFile(slopFilepath);
});

afterAll(async () => {
  await rm(dFolderpath, {recursive: true, force: true});
});

async function expectReadEqualsBuffer(fileId: string, initialBuffer: Buffer) {
  const readResult = await fimidara.files.readFile(
    {fileId},
    {responseType: 'stream'}
  );

  const dF = path.normalize(dFolderpath + '/' + randomUUID());
  await ensureFile(dF);
  await writeFile(dF, readResult);
  const savedBuffer = await readFile(dF);

  expect(savedBuffer.equals(initialBuffer)).toBe(true);
}

describe.each([
  {
    data: 'readable',
    getData: () => ({
      localFilepath: undefined,
      // data: Readable.from(slopBuffer!),
      data: createReadStream(slopFilepath),
      size: slopBuffer!.byteLength,
    }),
  },
  {
    data: 'buffer',
    getData: () => ({
      localFilepath: undefined,
      data: slopBuffer!,
      size: slopBuffer!.byteLength,
    }),
  },
  {
    data: 'string',
    getData: () => ({
      localFilepath: undefined,
      data: slopBuffer!.toString('utf-8'),
      size: slopBuffer!.byteLength,
    }),
  },
  {
    data: 'localFilepath',
    getData: () => ({
      localFilepath: slopFilepath,
      size: slopBuffer!.byteLength,
      data: undefined,
    }),
  },
])('multipartUploadNode, $data ', ({data: dataType, getData}) => {
  test(
    'upload',
    async () => {
      const {data, size, localFilepath} = getData();

      const description = faker.lorem.sentence();
      const encoding = 'base64';
      const filepath = fimidaraAddRootnameToPath(
        faker.system.filePath(),
        testVars.workspaceRootname
      );
      const mimetype = faker.system.mimeType();
      const result = await multipartUploadNode({
        data,
        localFilepath,
        size,
        description,
        encoding,
        filepath,
        mimetype,
        clientMultipartId: 'test-' + randomUUID(),
        endpoints: fimidara,
      });

      expect(result.file.description).toEqual(description);
      expect(result.file.encoding).toEqual(encoding);
      expect(result.file.mimetype).toEqual(mimetype);
      expect(result.file.size).toEqual(size);

      await expectReadEqualsBuffer(result.file.resourceId, slopBuffer!);
    },
    1000 * 60 * 5 // 5 minutes
  );
});
