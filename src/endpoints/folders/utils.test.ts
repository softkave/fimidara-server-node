import {getRandomIntInclusive} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {getStringListQuery} from '../../contexts/semantic/utils.js';
import {Folder} from '../../definitions/folder.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../testHelpers/generate/folder.js';
import {completeTests} from '../testHelpers/helpers/testFns.js';
import {initTests} from '../testHelpers/utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('utils', () => {
  test('case-insensitive file match', async () => {
    const parentNamepath = generateTestFolderpath({
      length: getRandomIntInclusive(1, 5),
    });
    const folders = await generateAndInsertTestFolders(
      /** count */ 5,
      {parentId: null},
      {parentNamepath}
    );
    const folderNamepathList = folders.map(folder => folder.namepath);
    const foldersByParent = await kIjxSemantic
      .folder()
      .getManyByQuery(
        getStringListQuery<Folder>(
          parentNamepath,
          /** prefix */ 'namepath',
          /** match op */ '$regex'
        )
      );
    const returnedFolders = await Promise.all(
      folderNamepathList.map(namepath =>
        kIjxSemantic
          .folder()
          .getOneByQuery(
            getStringListQuery<Folder>(
              namepath,
              /** prefix */ 'namepath',
              /** matcher op */ '$regex',
              /** include $size op */ true
            )
          )
      )
    );

    const folderIdList = folders.map(folder => folder.resourceId);
    const foldersByParentIdList = foldersByParent.map(
      folder => folder.resourceId
    );
    const returnedFoldersIdList = returnedFolders.map(
      folder => folder?.resourceId ?? ''
    );

    expect(foldersByParentIdList).toEqual(expect.arrayContaining(folderIdList));
    expect(returnedFoldersIdList).toEqual(expect.arrayContaining(folderIdList));
  });
});
