import {Folder} from '../../definitions/folder';
import {getRandomIntInclusive} from '../../utils/fns';
import {kSemanticModels} from '../contexts/injectables';
import {getStringListQuery} from '../contexts/semantic/utils';
import {
  generateAndInsertTestFolders,
  generateTestFolderName,
} from '../testUtils/generateData/folder';
import {completeTest} from '../testUtils/helpers/test';
import {initTest} from '../testUtils/testUtils';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('utils', () => {
  test('case-insensitive file match', async () => {
    const parentnamepath = new Array(getRandomIntInclusive(1, 5))
      .fill(0)
      .map(() => generateTestFolderName());
    const folders = await generateAndInsertTestFolders(
      /** count */ 5,
      {parentId: null},
      {parentnamepath}
    );
    const foldernamepathList = folders.map(folder => folder.namepath);
    const foldersByParent = await kSemanticModels
      .folder()
      .getManyByQuery(getStringListQuery<Folder>(parentnamepath, 'namepath'));
    const returnedFolders = await Promise.all(
      foldernamepathList.map(namepath =>
        context!.semantic.folder.getOneByQuery(
          getStringListQuery<Folder>(namepath, 'namepath', /** include $size op */ true)
        )
      )
    );

    const folderIdList = folders.map(folder => folder.resourceId);
    const foldersByParentIdList = foldersByParent.map(folder => folder.resourceId);
    const returnedFoldersIdList = returnedFolders.map(folder => folder?.resourceId ?? '');

    expect(foldersByParentIdList).toEqual(expect.arrayContaining(folderIdList));
    expect(returnedFoldersIdList).toEqual(expect.arrayContaining(folderIdList));
  });
});
