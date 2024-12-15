import {faker} from '@faker-js/faker';
import {ensureDir, ensureFile} from 'fs-extra';
import {readFile, rm, writeFile} from 'fs/promises';
import path from 'path-browserify';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {stringifyFimidaraFilepath} from '../../../path/index.js';
import {uploadFileTestExecFn} from '../../../testutils/execFns/file.js';
import {
  fimidaraTestInstance,
  fimidaraTestVars,
} from '../../../testutils/tests/file.js';
import {streamToString} from '../../../testutils/utils.node.js';
import {copyToFimidaraFile, copyToLocalFile} from '../copyFile.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/copyFile');
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await rm(testDir, {recursive: true, force: true});
});

describe('copyFile', () => {
  test('copyToLocalFile', async () => {
    const folderpath = path.join(
      testDir,
      faker.number.int({min: 10_000}).toString()
    );
    const localpath = path.join(
      folderpath,
      faker.number.int({min: 10_000}).toString()
    );

    const text = 'Hello World!';
    const buf = Buffer.from(text);
    const {file} = await uploadFileTestExecFn(
      fimidaraTestInstance,
      fimidaraTestVars,
      {
        data: text,
        size: buf.byteLength,
      }
    );

    const filepath = stringifyFimidaraFilepath(
      file,
      fimidaraTestVars.workspaceRootname
    );
    await copyToLocalFile(filepath, localpath, {
      authToken: fimidaraTestVars.authToken,
      serverURL: fimidaraTestVars.serverURL,
    });

    const actualContent = await readFile(localpath, 'utf-8');
    expect(actualContent).toBe(text);
  });

  test('copyToFimidaraFile', async () => {
    const foldername = faker.number.int({min: 10_000}).toString();
    const folderpath = path.join(testDir, foldername);
    const filename = faker.number.int({min: 10_000}).toString();
    const localpath = path.join(folderpath, filename);

    const text = 'Hello World!';
    const buf = Buffer.from(text);
    await ensureFile(localpath);
    await writeFile(localpath, text, 'utf-8');

    const filepath = stringifyFimidaraFilepath(
      {namepath: [foldername, filename]},
      fimidaraTestVars.workspaceRootname
    );
    await copyToFimidaraFile(
      filepath,
      localpath,
      /** stats */ {size: buf.byteLength},
      /** opts */ {
        authToken: fimidaraTestVars.authToken,
        serverURL: fimidaraTestVars.serverURL,
        clientMultipartIdPrefix: 'test001',
      }
    );

    const body = await fimidaraTestInstance.files.readFile(
      {filepath},
      {responseType: 'stream'}
    );

    const actualString = await streamToString(body);
    expect(text).toEqual(actualString);
  });
});
