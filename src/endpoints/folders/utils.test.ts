import {getRandomIntInclusive} from '../../utils/fns';
import {BaseContextType} from '../contexts/types';
import {
  generateAndInsertTestFolders,
  generateTestFolderName,
} from '../testUtils/generateData/folder';
import {completeTest} from '../testUtils/helpers/test';
import {assertContext, initTestBaseContext} from '../testUtils/testUtils';
import {getCaseInsensitiveNamePathQuery} from './utils';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('utils', () => {
  test('case-insensitive file match', async () => {
    assertContext(context);
    const parentNamePath = new Array(getRandomIntInclusive(1, 5))
      .fill(0)
      .map(() => generateTestFolderName());
    const folders = await generateAndInsertTestFolders(
      context,
      /** count */ 5,
      {parentId: null},
      {parentNamePath}
    );
    const folderNamePathList = folders.map(folder => folder.namePath);
    const foldersByParent = await context.semantic.folder.getManyByQuery(
      getCaseInsensitiveNamePathQuery(parentNamePath)
    );
    const returnedFolders = await Promise.all(
      folderNamePathList.map(namePath =>
        context!.semantic.folder.getOneByQuery(getCaseInsensitiveNamePathQuery(namePath))
      )
    );

    const folderIdList = folders.map(folder => folder.resourceId);
    const foldersByParentIdList = foldersByParent.map(folder => folder.resourceId);
    const returnedFoldersIdList = returnedFolders.map(folder => folder?.resourceId ?? '');

    expect(foldersByParentIdList).toEqual(expect.arrayContaining(folderIdList));
    expect(returnedFoldersIdList).toEqual(expect.arrayContaining(folderIdList));
  });
});
