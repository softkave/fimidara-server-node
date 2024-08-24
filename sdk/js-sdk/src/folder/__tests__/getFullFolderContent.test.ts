import {faker} from '@faker-js/faker';
import {sortStringListLexicographically} from 'softkave-js-utils';
import {describe, expect, test} from 'vitest';
import {
  genFimidaraFiles,
  genFimidaraFolders,
} from '../../testutils/syncUtils.js';
import {
  fimidaraTestInstance,
  fimidaraTestVars,
} from '../../testutils/tests/file.js';
import {
  stringifyFimidaraFilename,
  stringifyFimidaraFolderpath,
} from '../../utils.js';
import {getFullFolderContent} from '../getFullFolderContent.js';

describe('getFullFolderContent', () => {
  test('getFullFolderContent', async () => {
    const foldername = faker.number.int({min: 10_000}).toString();
    const fimidarapath = stringifyFimidaraFolderpath(
      {namepath: [foldername]},
      fimidaraTestVars.workspaceRootname
    );

    const {filenames} = await genFimidaraFiles(fimidarapath, /** count */ 10);
    const {foldernames} = await genFimidaraFolders(
      fimidarapath,
      /** count */ 10
    );

    const {files, folders} = await getFullFolderContent(fimidaraTestInstance, {
      body: {folderpath: fimidarapath},
    });

    const responseFilenames = files.map(stringifyFimidaraFilename);
    const responseFoldernames = folders.map(f => f.name);
    expect(sortStringListLexicographically(responseFilenames)).toEqual(
      sortStringListLexicographically(filenames)
    );
    expect(sortStringListLexicographically(responseFoldernames)).toEqual(
      sortStringListLexicographically(foldernames)
    );
  });
});
