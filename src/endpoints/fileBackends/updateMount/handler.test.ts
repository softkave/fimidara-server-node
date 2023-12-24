import {faker} from '@faker-js/faker';
import assert from 'assert';
import {kAppResourceType} from '../../../definitions/system';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {NotFoundError} from '../../errors';
import {getFolderpathInfo} from '../../folders/utils';
import {executeJob, waitForJob} from '../../jobs/runner';
import {generateAndInsertFileBackendConfigListForTest} from '../../testUtils/generate/fileBackend';
import {generateTestFolderpathString} from '../../testUtils/generate/folder';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
} from '../../testUtils/generate/utils';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests, matchExpects} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import updateFileBackendMount from './handler';
import {
  UpdateFileBackendMountEndpointParams,
  UpdateFileBackendMountEndpointResult,
  UpdateFileBackendMountInput,
} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('updateMount', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);

  const updateDefs: GenerateTestFieldsDef<UpdateFileBackendMountInput> = {
    configId: async () => {
      const [config] = await generateAndInsertFileBackendConfigListForTest(1, {
        workspaceId: workspace.resourceId,
      });

      return config.resourceId;
    },
    folderpath: () => generateTestFolderpathString({rootname: workspace.rootname}),
    index: () => faker.number.int(),
    mountedFrom: () => generateTestFolderpathString(),
    name: () => faker.lorem.words(),
    description: () => faker.lorem.paragraph(),
  };
  const updates = await generateTestFieldsCombinations(
    updateDefs,
    TestFieldsPresetCombinations.incrementallyAdd
  );

  updates.forEach(update => {
    test(`with updates ${Object.keys(update).join(',')}`, async () => {
      const {mount} = await insertFileBackendMountForTest(userToken, workspace);

      const instData =
        RequestData.fromExpressRequest<UpdateFileBackendMountEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {mountId: mount.resourceId, mount: update, workspaceId: workspace.resourceId}
        );
      const result = await updateFileBackendMount(instData);
      assertEndpointResultOk(result);

      const updatedMount = await kSemanticModels
        .fileBackendMount()
        .getOneById(result.mount.resourceId);
      assert(updatedMount);

      await matchExpects<
        [UpdateFileBackendMountInput, UpdateFileBackendMountEndpointResult]
      >(
        [
          {
            matcher: input => !!input.configId,
            expect: (input, result) => {
              expect(updatedMount.configId).toBe(input.configId);
              expect(result.mount.configId).toBe(input.configId);
            },
          },
          {
            matcher: input => !!input.folderpath,
            expect: async (input, result) => {
              const {namepath} = getFolderpathInfo(input.folderpath!);
              expect(updatedMount.folderpath).toBe(namepath);
              expect(result.mount.folderpath).toBe(namepath);

              const folder = await kSemanticModels.folder().getOneByNamepath({
                namepath,
                workspaceId: workspace.resourceId,
              });

              expect(folder).toBeTruthy();
            },
          },
          {
            matcher: input => !!input.index,
            expect: (input, result) => {
              expect(updatedMount.index).toBe(input.index);
              expect(result.mount.index).toBe(input.index);
            },
          },
          {
            matcher: input => !!input.mountedFrom,
            expect: (input, result) => {
              expect(updatedMount.mountedFrom).toBe(input.mountedFrom);
              expect(result.mount.mountedFrom).toBe(input.mountedFrom);
            },
          },
          {
            matcher: input => !!input.name,
            expect: (input, result) => {
              expect(updatedMount.name).toBe(input.name);
              expect(result.mount.name).toBe(input.name);
            },
          },
          {
            matcher: input => !!input.description,
            expect: (input, result) => {
              expect(updatedMount.description).toBe(input.description);
              expect(result.mount.description).toBe(input.description);
            },
          },
          {
            matcher: input => !input.folderpath && !input.mountedFrom,
            expect: (input, result) => {
              expect(result.jobId).toBeFalsy();
            },
          },
          {
            matcher: input => !!input.folderpath || !!input.mountedFrom,
            expect: async (input, result) => {
              expect(result.jobId).toBeTruthy();

              const job = await kSemanticModels.job().getOneByQuery({
                resourceId: result.jobId,
                type: 'cleanupMountResolvedEntries',
                params: {$objMatch: {mountId: mount.resourceId}},
              });
              expect(job).toBeTruthy();

              assert(result.jobId);
              await executeJob(result.jobId);
              await waitForJob(result.jobId);

              const [dbMountEntries] = await Promise.all([
                kSemanticModels.resolvedMountEntry().getMountEntries(mount.resourceId),
              ]);

              expect(dbMountEntries).toHaveLength(0);
            },
          },
        ],
        update,
        result
      );
    });
  });

  test('fails if mount does not exist', async () => {
    const instData = RequestData.fromExpressRequest<UpdateFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        mountId: getNewIdForResource(kAppResourceType.FileBackendMount),
        mount: {configId: getNewIdForResource(kAppResourceType.FileBackendConfig)},
        workspaceId: workspace.resourceId,
      }
    );

    await expectErrorThrown(
      async () => {
        await updateFileBackendMount(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.notFound().message
        )
    );
  });

  test('fails if config does not exist', async () => {
    const {mount} = await insertFileBackendMountForTest(userToken, workspace);

    const instData = RequestData.fromExpressRequest<UpdateFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        mountId: mount.resourceId,
        mount: {configId: getNewIdForResource(kAppResourceType.FileBackendConfig)},
        workspaceId: workspace.resourceId,
      }
    );

    await expectErrorThrown(
      async () => {
        await updateFileBackendMount(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.config.notFound().message
        )
    );
  });

  test('fails if mount with name exists', async () => {
    const [{mount: mount01}, {mount: mount02}] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace),
      insertFileBackendMountForTest(userToken, workspace),
    ]);

    const instData01 =
      RequestData.fromExpressRequest<UpdateFileBackendMountEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          mountId: mount01.resourceId,
          mount: {name: mount01.name},
          workspaceId: workspace.resourceId,
        }
      );
    const instData02 =
      RequestData.fromExpressRequest<UpdateFileBackendMountEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          mountId: mount02.resourceId,
          mount: {name: mount01.name},
          workspaceId: workspace.resourceId,
        }
      );

    await Promise.all([
      updateFileBackendMount(instData01),
      expectErrorThrown(
        async () => {
          await updateFileBackendMount(instData02);
        },
        error =>
          expect((error as Error).message).toBe(
            kReuseableErrors.mount.mountExists().message
          )
      ),
    ]);
  });
});
