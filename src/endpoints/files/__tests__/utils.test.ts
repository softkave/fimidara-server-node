import {indexArray, sortStringListLexicographically} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {addRootnameToPath} from '../../folders/utils.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testHelpers/utils.js';
import {
  createNewFileAndEnsureFolders,
  getFilepathInfo,
  stringifyFilenamepath,
} from '../utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('createNewFileAndEnsureFolders', () => {
  test('uses correct parent folder', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const inputFilepathList = [
      'public/books/book-item-list.json',
      'public/books/rbf/Righteousness by Faith.pdf',
      'public/books/rbf/description.mdx',
      'public/projects/project-item-list.json',
      'public/blogs/blog-def-list.json',
      'public/blogs/faith/the-love-of-abba-for-you.mdx',
      'public/blogs/faith/blog-item-list.json',
      'public/blogs/overengineered/blog-item-list.json',
      'public/blogs/overengineered/overengineered-00.mdx',
    ].map(filepath => addRootnameToPath(filepath, rawWorkspace.rootname));

    const files = await Promise.all(
      inputFilepathList.map(filepath =>
        createNewFileAndEnsureFolders(
          sessionAgent,
          rawWorkspace,
          getFilepathInfo(filepath, {
            containsRootname: true,
            allowRootFolder: false,
          }),
          /** data */ {},
          /** seed */ undefined,
          /** parentFolder */ null
        )
      )
    );

    const filesMap = indexArray(files, {
      indexer: f => stringifyFilenamepath(f.file, rawWorkspace.rootname),
    });
    const savedFilepathList = Object.keys(filesMap);
    expect(sortStringListLexicographically(savedFilepathList)).toEqual(
      sortStringListLexicographically(inputFilepathList)
    );
  });
});
