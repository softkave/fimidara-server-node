import {faker} from '@faker-js/faker';
import assert from 'assert';
import {randomUUID} from 'crypto';
import {createReadStream, ensureFile, rm} from 'fs-extra';
import {readFile, writeFile} from 'fs/promises';
import path from 'path';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  FimidaraEndpoints,
  fimidaraAddRootnameToPath,
  stringifyFimidaraFilepath,
} from '../../indexNode.js';
import {
  generateTestSlop,
  hasTestSlop,
} from '../../testutils/generate/generateTestSlop.node.js';
import {getTestVars} from '../../testutils/utils.common.js';
import {multipartUploadNode} from '../multipartNode.js';

const kMinSlopSize = 20 * 1024 * 1024; // 20MB
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
    await generateTestSlop({
      filepath: slopFilepath,
      minSize: kMinSlopSize,
    });
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

  test(
    'resume',
    async () => {
      // if (dataType === 'readable') {
      //   // it's not easy to finely control the size of each part
      //   // so we skip this test
      //   return;
      // }

      const {data, size, localFilepath} = getData();

      const filepath = fimidaraAddRootnameToPath(
        faker.system.filePath(),
        testVars.workspaceRootname
      );
      const clientMultipartId = 'test-' + randomUUID();

      const completedParts: number[] = [];

      try {
        await multipartUploadNode({
          data,
          size,
          localFilepath,
          filepath,
          clientMultipartId,
          endpoints: fimidara,
          numConcurrentParts: 1,
          afterPart: hookParams => {
            completedParts.push(hookParams.part);
          },
          beforePart: p => {
            if (completedParts.length > 0) {
              throw new Error('Simulated error');
            }
          },
        });
        assert.fail('Expected error');
      } catch (e) {
        // Retry
        const reqAgain = getData();
        const retryResult = await multipartUploadNode({
          filepath,
          clientMultipartId,
          data: reqAgain.data,
          size: reqAgain.size,
          localFilepath: reqAgain.localFilepath,
          endpoints: fimidara,
          beforePart: p => {
            if (completedParts.includes(p.part)) {
              throw new Error('Should not reupload completed parts');
            }
          },
          afterPart: hookParams => {
            completedParts.push(hookParams.part);
          },
        });

        expect(
          stringifyFimidaraFilepath(
            retryResult.file,
            testVars.workspaceRootname
          )
        ).toEqual(filepath);

        await expectReadEqualsBuffer(retryResult.file.resourceId, slopBuffer!);
      }
    },
    1000 * 60 * 5 // 5 minutes
  );
});
