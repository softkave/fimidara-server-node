import {faker} from '@faker-js/faker';
import assert from 'assert';
import {kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {pathJoin} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {NotFoundError} from '../../errors';
import {getFolderpathInfo} from '../../folders/utils';
import {generateAndInsertFileBackendConfigListForTest} from '../../testUtils/generate/fileBackend';
import {generateTestFolderpathString} from '../../testUtils/generate/folder';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
} from '../../testUtils/generate/utils';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {
  completeTests,
  matchExpects,
  softkaveTest,
  testCombinations,
} from '../../testUtils/helpers/test';
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

describe('updateMount', () => {
  softkaveTest.run('updates', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount} = await insertFileBackendMountForTest(userToken, workspace);
    const updateDefs: GenerateTestFieldsDef<UpdateFileBackendMountInput> = {
      configId: async () => {
        const [config] = await generateAndInsertFileBackendConfigListForTest(1, {
          workspaceId: workspace.resourceId,
          backend: mount.backend,
        });

        return config.resourceId;
      },
      folderpath: () => generateTestFolderpathString({rootname: workspace.rootname}),
      index: () => faker.number.int(),
      mountedFrom: () => generateTestFolderpathString(),
      name: () => faker.lorem.words(),
      description: () => faker.lorem.paragraph(),
    };
    const combinations = await generateTestFieldsCombinations(
      updateDefs,
      TestFieldsPresetCombinations.incrementallyAdd
    );

    await testCombinations(combinations, async combination => {
      const instData =
        RequestData.fromExpressRequest<UpdateFileBackendMountEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            mountId: mount.resourceId,
            mount: combination,
            workspaceId: workspace.resourceId,
          }
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
              assert(input.folderpath);
              const {namepath} = getFolderpathInfo(input.folderpath);
              expect(updatedMount.namepath).toEqual(namepath);
              expect(result.mount.namepath).toEqual(namepath);

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
              expect(pathJoin(updatedMount.mountedFrom)).toEqual(input.mountedFrom);
              expect(pathJoin(result.mount.mountedFrom)).toEqual(input.mountedFrom);
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
                type: kJobType.cleanupMountResolvedEntries,
                params: {$objMatch: {mountId: mount.resourceId}},
              });

              expect(job).toBeTruthy();
            },
          },
        ],
        combination,
        result
      );
    });
  });

  softkaveTest.run('fails if mount does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
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

  softkaveTest.run('fails if config does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
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

  softkaveTest.run('fails if mount with name exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
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
            kReuseableErrors.mount.mountNameExists().message
          )
      ),
    ]);
  });
});
