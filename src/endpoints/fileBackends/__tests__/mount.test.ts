import {faker} from '@faker-js/faker';
import {
  generateAndInsertFileBackendMountListForTest,
  generateFileBackendMountForTest,
} from '../../testUtils/generateData/fileBackend';
import {generateAndInsertTestFolders} from '../../testUtils/generateData/folder';
import {resolveMountsForFolder, sortMounts} from '../mountUtils';

describe('mount utils', () => {
  test('sortMounts', () => {
    const mount01 = generateFileBackendMountForTest({index: 5});
    const mount02 = generateFileBackendMountForTest({index: 4, createdAt: 10});
    const mount03 = generateFileBackendMountForTest({index: 3, createdAt: 11});
    const mount04 = generateFileBackendMountForTest({index: 2});

    const sortedMounts = sortMounts(
      faker.helpers.shuffle([mount01, mount02, mount03, mount04])
    );

    expect(sortedMounts[0].resourceId).toBe(mount01.resourceId);
    expect(sortedMounts[1].resourceId).toBe(mount02.resourceId);
    expect(sortedMounts[2].resourceId).toBe(mount03.resourceId);
    expect(sortedMounts[3].resourceId).toBe(mount04.resourceId);
  });

  test('resolveMountsForFolder', async () => {
    const [folder01] = await generateAndInsertTestFolders(1);
    const [folder02] = await generateAndInsertTestFolders(
      1,
      {workspaceId: folder01.workspaceId, parentId: folder01.resourceId},
      {parentnamepath: folder01.namepath}
    );
    const [folder03] = await generateAndInsertTestFolders(
      1,
      {workspaceId: folder02.workspaceId, parentId: folder02.resourceId},
      {parentnamepath: folder02.namepath}
    );
    const [mounts01, mounts02, mounts03] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(2, {
        folderpath: folder01.namepath,
        workspaceId: folder01.workspaceId,
      }),
      generateAndInsertFileBackendMountListForTest(2, {
        folderpath: folder02.namepath,
        workspaceId: folder02.workspaceId,
      }),
      generateAndInsertFileBackendMountListForTest(2, {
        folderpath: folder03.namepath,
        workspaceId: folder03.workspaceId,
      }),
    ]);

    const folderMounts = await resolveMountsForFolder(folder03);

    expect(folderMounts.slice(0, 2)).toEqual(expect.arrayContaining(mounts01));
    expect(folderMounts.slice(2, 4)).toEqual(expect.arrayContaining(mounts02));
    expect(folderMounts.slice(4)).toEqual(expect.arrayContaining(mounts03));
  });
});
