import {faker} from '@faker-js/faker';
import {compact, last} from 'lodash';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {
  loopAndCollate,
  loopAndCollateAsync,
  pathJoin,
  pathSplit,
  sortStringListLexographically,
} from '../../../utils/fns.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateTestFilepathString} from '../../testUtils/generate/file.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderName,
  generateTestFolderpath,
} from '../../testUtils/generate/folder.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {FolderQueries} from '../queries.js';
import {addRootnameToPath, stringifyFoldernamepath} from '../utils.js';
import {createFolderList} from './createFolderList.js';
import {getExistingFoldersAndArtifacts} from './getExistingFoldersAndArtifacts.js';

/**
 * TODO:
 * - Test different folder paths
 * - Test on root
 * - prev folders not recreated
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addFolder', () => {
  test('folder created', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const folderName00 = generateTestFolderName();
    const folderName01 = generateTestFolderName();
    const folderName02 = generateTestFolderName();
    const folderpath02 = addRootnameToPath(
      '/' + folderName00 + '/' + folderName01 + '/' + folderName02,
      workspace.rootname
    );
    await insertFolderForTest(userToken, workspace, {
      folderpath: folderpath02,
    });

    const inputNames = [folderName00, folderName01, folderName02];
    const savedFolders = await kSemanticModels.folder().getManyByQuery({
      workspaceId: workspace.resourceId,
      name: {$in: inputNames},
    });
    const savedFolderNames = savedFolders.map(f => f.name);
    expect(savedFolderNames).toEqual(expect.arrayContaining(inputNames));
    expect(savedFolderNames).toHaveLength(inputNames.length);
  });

  test('get existing folders and artifacts', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const folderNamepath02 = generateTestFolderpath({length: 3});
    const [[folder00], [folder01], [folder02]] = await Promise.all([
      generateAndInsertTestFolders(1, {
        workspaceId: workspace.resourceId,
        parentId: null,
        namepath: folderNamepath02.slice(0, 1),
      }),
      generateAndInsertTestFolders(1, {
        workspaceId: workspace.resourceId,
        parentId: null,
        namepath: folderNamepath02.slice(0, 2),
      }),
      generateAndInsertTestFolders(1, {
        workspaceId: workspace.resourceId,
        parentId: null,
        namepath: folderNamepath02,
      }),
    ]);

    const {
      existingFolders,
      foldersByNamepath,
      inputList,
      pathinfoList,
      namepathList,
      getSelfOrClosestParent,
    } = await kSemanticModels
      .utils()
      .withTxn(
        opts =>
          getExistingFoldersAndArtifacts(
            workspace.resourceId,
            [
              {folderpath: stringifyFoldernamepath(folder00, workspace.rootname)},
              {folderpath: stringifyFoldernamepath(folder01, workspace.rootname)},
              {folderpath: stringifyFoldernamepath(folder02, workspace.rootname)},
              {folderpath: stringifyFoldernamepath(folder00, workspace.rootname)},
              {folderpath: stringifyFoldernamepath(folder01, workspace.rootname)},
              {folderpath: stringifyFoldernamepath(folder02, workspace.rootname)},
            ],
            opts
          ),
        /** reuseTxn */ true
      );

    expect(existingFolders.length).toBe(3);
    expect(namepathList.length).toBe(3);
    expect(inputList.length).toBe(6);
    expect(pathinfoList.length).toBe(6);
    expect(sortStringListLexographically(Object.keys(foldersByNamepath))).toEqual(
      sortStringListLexographically(
        folderNamepath02
          .map((name, index) => folderNamepath02.slice(0, index + 1))
          .map(namepath => pathJoin(namepath))
          .map(p => p.toLowerCase())
      )
    );

    const sp00 = getSelfOrClosestParent([]);
    const sp01 = getSelfOrClosestParent(folderNamepath02.slice(0, 1));
    const sp02 = getSelfOrClosestParent(folderNamepath02.slice(0, 2));
    const sp03 = getSelfOrClosestParent(folderNamepath02);
    const sp04 = getSelfOrClosestParent(
      folderNamepath02.concat(generateTestFolderName())
    );
    expect(sp00).toBeFalsy();
    expect(sp01?.name).toBe(folder00.name);
    expect(sp02?.name).toBe(folder01.name);
    expect(sp03?.name).toBe(folder02.name);
    expect(sp04?.name).toBe(folder02.name);
  });

  test('existing folder not duplicated', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const folderName00 = generateTestFolderName();
    const folderName01 = generateTestFolderName();
    const folderName02 = generateTestFolderName();

    const folderpath00 = addRootnameToPath(pathJoin([folderName00]), workspace.rootname);
    const folderpath01 = addRootnameToPath(
      pathJoin([folderName00, folderName01]),
      workspace.rootname
    );
    const folderpath02 = addRootnameToPath(
      pathJoin([folderName00, folderName02]),
      workspace.rootname
    );

    await insertFolderForTest(userToken, workspace, {folderpath: folderpath00});
    await Promise.all([
      insertFolderForTest(userToken, workspace, {folderpath: folderpath01}),
      insertFolderForTest(userToken, workspace, {folderpath: folderpath02}),
    ]);

    const dbFolders = await kSemanticModels.folder().getManyByQuery({
      $or: [
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [folderName00],
        }),
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [folderName00, folderName01],
        }),
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [folderName00, folderName02],
        }),
      ],
    });

    // there should be 3 folder, the parent folder and the 2 children folders
    expect(dbFolders.length).toBe(3);
    const dbFolderNames = dbFolders.map(f => f.name);
    expect(sortStringListLexographically(dbFolderNames)).toEqual(
      sortStringListLexographically([folderName00, folderName01, folderName02])
    );
  });

  test('new folder not duplicated', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const parentFoldername = generateTestFolderName();
    const folderName01 = generateTestFolderName();
    const folderName02 = generateTestFolderName();
    const folderName03 = generateTestFolderName();
    const folderName04 = generateTestFolderName();

    const folderpath01 = addRootnameToPath(
      pathJoin([parentFoldername, folderName01]),
      workspace.rootname
    );
    const folderpath02 = addRootnameToPath(
      pathJoin([parentFoldername, folderName02]),
      workspace.rootname
    );
    const folderpath03 = addRootnameToPath(
      pathJoin([parentFoldername, folderName03]),
      workspace.rootname
    );
    const folderpath04 = addRootnameToPath(
      pathJoin([parentFoldername, folderName04]),
      workspace.rootname
    );

    await Promise.all([
      insertFolderForTest(userToken, workspace, {folderpath: folderpath01}),
      insertFolderForTest(userToken, workspace, {folderpath: folderpath02}),
      insertFolderForTest(userToken, workspace, {folderpath: folderpath03}),
      insertFolderForTest(userToken, workspace, {folderpath: folderpath04}),
    ]);

    const dbFolders = await kSemanticModels.folder().getManyByQuery({
      $or: [
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [parentFoldername],
        }),
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [parentFoldername, folderName01],
        }),
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [parentFoldername, folderName02],
        }),
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [parentFoldername, folderName03],
        }),
        FolderQueries.getByNamepath({
          workspaceId: workspace.resourceId,
          namepath: [parentFoldername, folderName04],
        }),
      ],
    });

    const dbFolderNames = dbFolders.map(f => f.name);
    // there should be 5 folder, the parent folder and the 4 children folders
    expect(dbFolders.length).toBe(5);
    expect(sortStringListLexographically(dbFolderNames)).toEqual(
      sortStringListLexographically([
        parentFoldername,
        folderName01,
        folderName02,
        folderName03,
        folderName04,
      ])
    );
  });

  test('new folder not duplicated using createFolderList', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);

    const partsLength = faker.number.int({min: 3, max: 7});
    const leafLength = faker.number.int({min: 5, max: 10});
    const parentPath = generateTestFolderpath({length: partsLength - 1});
    const leafFolderpaths = loopAndCollate(
      () =>
        generateTestFilepathString({
          parentNamepath: parentPath,
          length: partsLength,
          rootname: workspace.rootname,
        }),
      leafLength
    );

    const withinTxnCount = faker.number.int({min: 1, max: partsLength});
    await loopAndCollateAsync(
      txnIndex =>
        kSemanticModels.utils().withTxn(
          opts =>
            createFolderList(
              kSystemSessionAgent,
              workspace,
              leafFolderpaths
                .slice(txnIndex, txnIndex + withinTxnCount)
                .map(folderpath => ({folderpath})),
              /** skip auth */ true,
              /** throw if folder exists */ false,
              opts,
              /** throw on error */ true
            ),
          /** reuse txn */ false
        ),
      leafLength,
      /** settlement type */ 'all'
    );

    const dbFolders = await kSemanticModels.folder().getManyByQuery({
      workspaceId: workspace.resourceId,
    });

    // there should be 3 folder, the parent folder and the 2 children folders
    expect(dbFolders.length).toBe(leafLength + (partsLength - 1));
    const dbFolderNames = dbFolders.map(f => f.name);
    expect(dbFolderNames).toEqual(
      pathSplit(parentPath).concat(
        compact(leafFolderpaths.map(folderpath => last(pathSplit(folderpath))))
      )
    );
  });
});
