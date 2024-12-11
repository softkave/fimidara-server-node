import {faker} from '@faker-js/faker';
import assert from 'assert';
import {randomUUID} from 'crypto';
import {readFile} from 'fs/promises';
import path from 'path';
import {AnyFn} from 'softkave-js-utils';
import {Readable} from 'stream';
import {buffer} from 'stream/consumers';
import {beforeAll, describe, expect, test} from 'vitest';
import {
  fimidaraAddRootnameToPath,
  FimidaraEndpoints,
  stringifyFimidaraFilepath,
} from '../index.js';
import {
  generateTestSlop,
  hasTestSlop,
} from '../testutils/generate/generateTestSlop.js';
import {getTestVars} from '../testutils/utils.js';
import {multipartUploadBrowser} from './multipartBrowser.js';
import {multipartUploadNode} from './multipartNode.js';

const kMinSlopSize = 20 * 1024 * 1024; // 20MB
const testVars = getTestVars();
const slopFilepath = path.normalize(
  process.cwd() + testVars.testFolderPath + '/slop/multipart-slop.txt'
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

async function expectReadEquals(fileId: string, buffer: Buffer) {
  const readResult = await fimidara.files.readFile<'blob'>({
    fileId,
  });
  const savedBuffer = await readResult.arrayBuffer();
  expect(savedBuffer).toEqual(buffer);
}

interface ITestStuff {
  data: string;
  getData: () => {
    data: string | Blob;
    size: number;
  };
  fn: AnyFn;
}

function getTestStuffForBrowser(dataType: 'blob' | 'string') {
  switch (dataType) {
    case 'blob':
      return {
        data: 'blob',
        getData: () => ({
          data: new Blob([slopBuffer!]),
          size: slopBuffer!.byteLength,
        }),
        fn: multipartUploadBrowser,
      };
    case 'string':
      return {
        data: 'string',
        getData: () => ({
          data: slopBuffer!.toString('base64'),
          size: slopBuffer!.byteLength,
        }),
        fn: multipartUploadBrowser,
      };
  }
}

describe.each([
  {
    data: 'blob',
    getData: () => ({
      data: new Blob([slopBuffer!]),
      size: slopBuffer!.byteLength,
    }),
  },
  {
    data: 'string',
    getData: () => ({
      data: slopBuffer!.toString('base64'),
      size: slopBuffer!.byteLength,
    }),
  },
])('multipartUploadBrowser, $data ', ({data, getData}) => {
  test('upload', async () => {
    const {data, size} = getData();

    const description = faker.lorem.sentence();
    const encoding = 'base64';
    const filepath = fimidaraAddRootnameToPath(
      faker.system.filePath(),
      testVars.workspaceRootname
    );
    const mimetype = faker.system.mimeType();
    const result = await multipartUploadBrowser({
      data,
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

    await expectReadEquals(result.file.resourceId, slopBuffer!);
  });

  test('resume', async () => {
    const {data, size} = getData();

    const filepath = fimidaraAddRootnameToPath(
      faker.system.filePath(),
      testVars.workspaceRootname
    );
    const clientMultipartId = 'test-' + randomUUID();

    const completedParts: number[] = [];

    try {
      await multipartUploadBrowser({
        data,
        size,
        filepath,
        clientMultipartId,
        endpoints: fimidara,
        numConcurrentParts: 1,
        afterPart: part => {
          completedParts.push(part);
        },
        beforePart: () => {
          if (completedParts.length > 0) {
            throw new Error('Simulated error');
          }
        },
      });
      assert.fail('Expected error');
    } catch (e) {
      // Retry
      const retryResult = await multipartUploadBrowser({
        data,
        size,
        filepath,
        clientMultipartId,
        endpoints: fimidara,
        afterPart: part => {
          completedParts.push(part);
        },
      });

      expect(
        stringifyFimidaraFilepath(retryResult.file, testVars.workspaceRootname)
      ).toEqual(filepath);

      await expectReadEquals(retryResult.file.resourceId, slopBuffer!);
    }
  });
});

describe.each([
  {
    data: 'readable',
    getData: () => ({
      localFilepath: undefined,
      data: Readable.from(slopBuffer!),
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
      data: slopBuffer!.toString('base64'),
      size: slopBuffer!.byteLength,
    }),
  },
  {
    data: 'localFilepath',
    getData: () => ({
      localFilepath: slopFilepath,
      size: undefined,
      data: undefined,
    }),
  },
])('multipartUploadNode, $data ', ({data, getData}) => {
  test('upload', async () => {
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

    const readResult = await fimidara.files.readFile<'blob'>({
      fileId: result.file.resourceId,
    });
    const savedBuffer = await readResult.arrayBuffer();
    expect(savedBuffer).toEqual(buffer);
  });

  test('resume', async () => {
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
        afterPart: part => {
          completedParts.push(part);
        },
        beforePart: () => {
          if (completedParts.length > 0) {
            throw new Error('Simulated error');
          }
        },
      });
      assert.fail('Expected error');
    } catch (e) {
      // Retry
      const retryResult = await multipartUploadNode({
        data,
        size,
        localFilepath,
        filepath,
        clientMultipartId,
        endpoints: fimidara,
        afterPart: part => {
          completedParts.push(part);
        },
      });

      expect(
        stringifyFimidaraFilepath(retryResult.file, testVars.workspaceRootname)
      ).toEqual(filepath);

      await expectReadEquals(retryResult.file.resourceId, slopBuffer!);
    }
  });
});
