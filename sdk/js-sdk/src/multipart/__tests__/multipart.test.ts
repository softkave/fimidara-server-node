import {faker} from '@faker-js/faker';
import assert from 'assert';
import {randomUUID} from 'crypto';
import {createReadStream, ensureFile, rm} from 'fs-extra';
import {readFile, writeFile} from 'fs/promises';
import {intersection} from 'lodash-es';
import path from 'path';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  FimidaraEndpoints,
  IMultipartUploadHookFnParams,
  IMultipartUploadParamsWithTestInstrumentation,
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

function getReadableDataFromSlop() {
  return {
    localFilepath: undefined,
    // data: Readable.from(slopBuffer!),
    data: createReadStream(slopFilepath),
    size: slopBuffer!.byteLength,
  };
}

function getBufferDataFromSlop() {
  return {
    localFilepath: undefined,
    data: slopBuffer!,
    size: slopBuffer!.byteLength,
  };
}

function getStringDataFromSlop() {
  return {
    localFilepath: undefined,
    data: slopBuffer!.toString('utf-8'),
    size: slopBuffer!.byteLength,
  };
}

function getLocalFilepathDataFromSlop() {
  return {
    localFilepath: slopFilepath,
    size: slopBuffer!.byteLength,
    data: undefined,
  };
}

describe.each([
  {data: 'readable', getData: getReadableDataFromSlop},
  {data: 'buffer', getData: getBufferDataFromSlop},
  {data: 'string', getData: getStringDataFromSlop},
  {data: 'localFilepath', getData: getLocalFilepathDataFromSlop},
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
    1000 * 30 // 30 seconds
  );

  test.each([
    {resume: true, firePartEventsForResumedParts: true},
    {resume: true, firePartEventsForResumedParts: false},
    {resume: false, firePartEventsForResumedParts: true},
  ])(
    'resume: $resume, firePartEventsForResumedParts: $firePartEventsForResumedParts',
    async ({resume, firePartEventsForResumedParts}) => {
      const {data, size, localFilepath} = getData();
      const filepath = fimidaraAddRootnameToPath(
        faker.system.filePath(),
        testVars.workspaceRootname
      );

      const clientMultipartId = 'test-' + randomUUID();
      const firstTryCompletedParts: number[] = [];
      const secondTryCompletedParts: number[] = [];

      try {
        await multipartUploadNode({
          data,
          size,
          localFilepath,
          filepath,
          clientMultipartId,
          resume,
          endpoints: fimidara,
          numConcurrentParts: 1,
          maxRetryCount: 0,
          afterPart: hookParams => {
            firstTryCompletedParts.push(hookParams.part);
          },
          beforePart: p => {
            if (firstTryCompletedParts.length > 0) {
              throw new Error('Simulated error');
            }
          },
        });
        assert.fail('Expected error');
      } catch (e) {
        assert(firstTryCompletedParts.length > 0);

        // Retry
        const reqAgain = getData();
        const retryResult = await multipartUploadNode({
          filepath,
          resume,
          clientMultipartId,
          data: reqAgain.data,
          size: reqAgain.size,
          localFilepath: reqAgain.localFilepath,
          endpoints: fimidara,
          firePartEventsForResumedParts,
          beforePart: p => {
            if (
              firstTryCompletedParts.includes(p.part) &&
              resume &&
              !firePartEventsForResumedParts
            ) {
              throw new Error('Should not reupload completed parts');
            }
          },
          afterPart: hookParams => {
            secondTryCompletedParts.push(hookParams.part);
          },
        });

        const fp = stringifyFimidaraFilepath(
          retryResult.file,
          testVars.workspaceRootname
        );

        expect(fp).toEqual(filepath);

        if (resume) {
          if (firePartEventsForResumedParts) {
            expect(
              intersection(firstTryCompletedParts, secondTryCompletedParts)
                .length
            ).toBe(firstTryCompletedParts.length);
          } else {
            expect(
              intersection(firstTryCompletedParts, secondTryCompletedParts)
                .length
            ).toBe(0);
          }
        } else {
          expect(
            intersection(firstTryCompletedParts, secondTryCompletedParts).length
          ).toBe(firstTryCompletedParts.length);
        }

        await expectReadEqualsBuffer(retryResult.file.resourceId, slopBuffer!);
      }
    },
    1000 * 30 // 30 seconds
  );
});

describe('multipartUploadNode, maxRetryCount', () => {
  test('should fail if maxRetryCount is exceeded', async () => {
    const {data, size} = getBufferDataFromSlop();
    const filepath = fimidaraAddRootnameToPath(
      crypto.randomUUID() + '/' + faker.system.filePath(),
      testVars.workspaceRootname
    );

    const clientMultipartId = 'test-' + randomUUID();
    const firstTryCompletedParts: number[] = [];

    await expect(async () => {
      const params: IMultipartUploadParamsWithTestInstrumentation &
        Parameters<typeof multipartUploadNode>[0] = {
        data,
        size,
        filepath,
        clientMultipartId,
        endpoints: fimidara,
        maxRetryCount: 3,
        __afterPart: hookParams => {
          firstTryCompletedParts.push(hookParams.part);
        },
        __beforePart: p => {
          if (firstTryCompletedParts.length > 0) {
            throw new Error('Simulated error');
          }
        },
      };

      await multipartUploadNode(params);
    }).rejects.toThrow('Simulated error');
  });

  test('should fail if a part fails more than 3 times', async () => {
    const {data, size} = getBufferDataFromSlop();
    const filepath = fimidaraAddRootnameToPath(
      crypto.randomUUID() + '/' + faker.system.filePath(),
      testVars.workspaceRootname
    );

    const clientMultipartId = 'test-' + randomUUID();

    await expect(async () => {
      const params: IMultipartUploadParamsWithTestInstrumentation &
        Parameters<typeof multipartUploadNode>[0] = {
        data,
        size,
        filepath,
        clientMultipartId,
        endpoints: fimidara,
        maxRetryCount: 3,
        __beforePart: p => {
          if (p.part === 1) {
            throw new Error('Simulated error');
          }
        },
      };

      await multipartUploadNode(params);
    }).rejects.toThrow('Simulated error');
  });

  test('should succeed if maxRetryCount is not exceeded', async () => {
    const {data, size} = getBufferDataFromSlop();
    const description = faker.lorem.sentence();
    const encoding = 'base64';
    const filepath = fimidaraAddRootnameToPath(
      crypto.randomUUID() + '/' + faker.system.filePath(),
      testVars.workspaceRootname
    );
    const mimetype = faker.system.mimeType();

    const clientMultipartId = 'test-' + randomUUID();
    const firstTryCompletedParts: number[] = [];
    let simulatedError = false;

    const result = await multipartUploadNode({
      data,
      size,
      filepath,
      description,
      encoding,
      mimetype,
      clientMultipartId,
      endpoints: fimidara,
      maxRetryCount: 3,
      afterPart: hookParams => {
        firstTryCompletedParts.push(hookParams.part);
      },
      beforePart: p => {
        if (firstTryCompletedParts.length > 0 && !simulatedError) {
          simulatedError = true;
          throw new Error('Simulated error');
        }
      },
    });

    expect(result.file.description).toEqual(description);
    expect(result.file.encoding).toEqual(encoding);
    expect(result.file.mimetype).toEqual(mimetype);
    expect(result.file.size).toEqual(size);

    await expectReadEqualsBuffer(result.file.resourceId, slopBuffer!);
  });
});

describe('multipartUploadNode, part events', () => {
  test('should fire part events', async () => {
    const {data, size} = getBufferDataFromSlop();
    const filepath = fimidaraAddRootnameToPath(
      faker.system.filePath(),
      testVars.workspaceRootname
    );

    const clientMultipartId = 'test-' + randomUUID();
    const beforePartEvents: IMultipartUploadHookFnParams[] = [];
    const afterPartEvents: IMultipartUploadHookFnParams[] = [];

    await multipartUploadNode({
      data,
      size,
      filepath,
      clientMultipartId,
      endpoints: fimidara,
      maxRetryCount: 3,
      afterPart: hookParams => {
        afterPartEvents.push(hookParams);
      },
      beforePart: hookParams => {
        beforePartEvents.push(hookParams);
      },
    });

    const lastAfterPartEvent = afterPartEvents[afterPartEvents.length - 1];
    expect(lastAfterPartEvent.percentComplete).toBe(100);
    expect(lastAfterPartEvent.sizeCompleted).toBe(size);

    const lastBeforePartEvent = beforePartEvents[beforePartEvents.length - 1];
    expect(lastBeforePartEvent.percentComplete).not.toBe(100);
    expect(lastBeforePartEvent.sizeCompleted).not.toBe(size);

    beforePartEvents.forEach((beforePartEvent, i) => {
      const afterPartEvent = afterPartEvents.find(
        p => p.part === beforePartEvent.part
      );
      expect(afterPartEvent?.percentComplete).toBeGreaterThan(
        beforePartEvent.percentComplete
      );
      expect(afterPartEvent?.sizeCompleted).toBeGreaterThan(
        beforePartEvent.sizeCompleted
      );
    });
  });

  test('should fire part events for resumed parts', async () => {
    const {data, size} = getBufferDataFromSlop();
    const filepath = fimidaraAddRootnameToPath(
      faker.system.filePath(),
      testVars.workspaceRootname
    );

    const clientMultipartId = 'test-' + randomUUID();
    const afterPartEvents: IMultipartUploadHookFnParams[] = [];

    try {
      let hasOnePartUploaded = false;
      await multipartUploadNode({
        data,
        size,
        filepath,
        clientMultipartId,
        endpoints: fimidara,
        maxRetryCount: 0,
        afterPart: hookParams => {
          hasOnePartUploaded = true;
        },
        beforePart: hookParams => {
          if (hasOnePartUploaded) {
            throw new Error('Simulated error');
          }
        },
      });
    } catch (e) {
      await multipartUploadNode({
        data,
        size,
        filepath,
        clientMultipartId,
        endpoints: fimidara,
        maxRetryCount: 3,
        afterPart: hookParams => {
          afterPartEvents.push(hookParams);
        },
      });
    }

    const lastAfterPartEvent = afterPartEvents[afterPartEvents.length - 1];
    expect(lastAfterPartEvent.percentComplete).toBe(100);
    expect(lastAfterPartEvent.sizeCompleted).toBe(size);

    afterPartEvents.forEach((afterPartEvent, i) => {
      const prevAfterPartEvent = afterPartEvents.find(
        p => p.part === afterPartEvent.part - 1
      );
      expect(afterPartEvent?.percentComplete).toBeGreaterThan(
        prevAfterPartEvent?.percentComplete ?? 0
      );
      expect(afterPartEvent?.sizeCompleted).toBeGreaterThan(
        prevAfterPartEvent?.sizeCompleted ?? 0
      );
    });
  });
});
