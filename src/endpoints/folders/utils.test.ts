import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {getStringListQuery} from '../../contexts/semantic/utils.js';
import {Folder} from '../../definitions/folder.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../testUtils/generate/folder.js';
import {completeTests} from '../testUtils/helpers/testFns.js';
import {initTests} from '../testUtils/testUtils.js';
import {getRandomIntInclusive} from 'softkave-js-utils';

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
    const foldersByParent = await kSemanticModels
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
        kSemanticModels
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
