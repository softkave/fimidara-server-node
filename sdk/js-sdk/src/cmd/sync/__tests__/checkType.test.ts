import {faker} from '@faker-js/faker';
import assert from 'assert';
import {describe, expect, test} from 'vitest';
import {
  stringifyFimidaraFilepath,
  stringifyFimidaraFolderpath,
} from '../../../path/index.js';
import {uploadFileTestExecFn} from '../../../testutils/execFns/file.js';
import {addFolderTestExecFn} from '../../../testutils/execFns/folder.js';
import {
  fimidaraTestInstance,
  fimidaraTestVars,
} from '../../../testutils/tests/file.js';
import {checkFimidaraType} from '../checkType.js';
import {kFileEntryType} from '../types.js';

describe('checkType', () => {
  test('file', async () => {
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
    const response = await checkFimidaraType(filepath, {
      authToken: fimidaraTestVars.authToken,
      serverURL: fimidaraTestVars.serverURL,
    });

    assert(response);
    assert(response.type === kFileEntryType.file);
    expect(response.file).toBeTruthy();
    expect(filepath).toBe(
      stringifyFimidaraFilepath(
        response.file,
        fimidaraTestVars.workspaceRootname
      )
    );
  });

  test('folder', async () => {
    const {folder} = await addFolderTestExecFn(
      fimidaraTestInstance,
      fimidaraTestVars
    );

    const folderpath = stringifyFimidaraFolderpath(
      folder,
      fimidaraTestVars.workspaceRootname
    );
    const response = await checkFimidaraType(folderpath, {
      authToken: fimidaraTestVars.authToken,
      serverURL: fimidaraTestVars.serverURL,
    });

    assert(response);
    assert(response.type === kFileEntryType.folder);
    expect(response.folder).toBeTruthy();
    expect(folderpath).toBe(
      stringifyFimidaraFolderpath(
        response.folder,
        fimidaraTestVars.workspaceRootname
      )
    );
  });

  test('not found', async () => {
    const folderpath = stringifyFimidaraFolderpath(
      {namepath: [faker.number.int({min: 1_000_000}).toString()]},
      fimidaraTestVars.workspaceRootname
    );
    const response = await checkFimidaraType(folderpath, {
      authToken: fimidaraTestVars.authToken,
      serverURL: fimidaraTestVars.serverURL,
    });

    expect(response).toBe(undefined);
  });
});
