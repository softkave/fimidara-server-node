import {Readable} from 'stream';
import {ResolvedMountEntry} from '../../../definitions/fileBackend';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {kFimidaraResourceType} from '../../../definitions/system';
import {pathJoin, streamToBuffer} from '../../../utils/fns';
import {newWorkspaceResource} from '../../../utils/resource';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {FilePersistenceProvider, PersistedFile} from '../../contexts/file/types';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register';
import {addRootnameToPath, stringifyFoldernamepath} from '../../folders/utils';
import NoopFilePersistenceProviderContext from '../../testUtils/context/file/NoopFilePersistenceProviderContext';
import {
  generateTestFileName,
  generateTestFilepathString,
} from '../../testUtils/generate/file';
import {getTestSessionAgent, kTestSessionAgentTypes} from '../../testUtils/helpers/agent';
import {expectFileBodyEqual, expectFileBodyEqualById} from '../../testUtils/helpers/file';
import {completeTests, skTest} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertFolderForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import {stringifyFilenamepath} from '../utils';
import readFile from './handler';
import {ReadFileEndpointParams} from './types';
import sharp = require('sharp');
import assert = require('assert');

jest.setTimeout(300000); // 5 minutes
beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('readFile', () => {
  skTest.each(kTestSessionAgentTypes)('file returned using %s', async agentType => {
    const {
      sessionAgent,
      workspace,
      adminUserToken: userToken,
    } = await getTestSessionAgent(agentType, {
      permissions: {
        actions: [kFimidaraPermissionActionsMap.readFile],
      },
    });
    const {file} = await insertFileForTest(userToken, workspace);

    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(sessionAgent.agentToken),
      /** data */ {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);

    await expectFileBodyEqualById(file.resourceId, result.stream);
  });

  skTest.run('file resized', async () => {
    const {
      sessionAgent,
      workspace,
      adminUserToken: userToken,
    } = await getTestSessionAgent(kFimidaraResourceType.User, {
      permissions: {actions: [kFimidaraPermissionActionsMap.readFile]},
    });
    const startWidth = 500;
    const startHeight = 500;
    const {file} = await insertFileForTest(
      userToken,
      workspace,
      /** file input */ {},
      /** file type */ 'png',
      /** image props */ {width: startWidth, height: startHeight}
    );

    const expectedWidth = 300;
    const expectedHeight = 300;
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(sessionAgent.agentToken),
      /** data */ {
        filepath: stringifyFilenamepath(file, workspace.rootname),
        imageResize: {width: expectedWidth, height: expectedHeight},
      }
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);

    const resultBuffer = await streamToBuffer(result.stream);
    assert(resultBuffer);
    const fileMetadata = await sharp(resultBuffer).metadata();
    expect(fileMetadata.width).toEqual(expectedWidth);
    expect(fileMetadata.height).toEqual(expectedHeight);
  });

  skTest.each(kTestSessionAgentTypes)(
    '%s can read file from public folder',
    async agentType => {
      const {workspace, adminUserToken: userToken} = await getTestSessionAgent(agentType);
      const {folder} = await insertFolderForTest(userToken, workspace);
      await insertPermissionItemsForTest(userToken, workspace.resourceId, {
        target: {targetId: folder.resourceId},
        action: kFimidaraPermissionActionsMap.readFile,
        access: true,
        entityId: workspace.publicPermissionGroupId,
      });

      const {file} = await insertFileForTest(userToken, workspace, {
        filepath: addRootnameToPath(
          pathJoin(
            folder.namepath.concat([generateTestFileName({includeStraySlashes: true})])
          ),
          workspace.rootname
        ),
      });

      const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(instData);
      assertEndpointResultOk(result);
    }
  );

  skTest.each(kTestSessionAgentTypes)('%s can read public file', async agentType => {
    const {workspace, adminUserToken} = await getTestSessionAgent(agentType);
    const {file} = await insertFileForTest(adminUserToken, workspace);
    await insertPermissionItemsForTest(adminUserToken, workspace.resourceId, {
      target: {targetId: file.resourceId},
      action: kFimidaraPermissionActionsMap.readFile,
      access: true,
      entityId: workspace.publicPermissionGroupId,
    });

    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);
  });

  skTest.each(kTestSessionAgentTypes)('%s cannot read private file', async agentType => {
    const {
      sessionAgent,
      workspace,
      adminUserToken: userToken,
    } = await getTestSessionAgent(agentType);

    const {file} = await insertFileForTest(userToken, workspace);
    await insertPermissionItemsForTest(userToken, workspace.resourceId, {
      target: {targetId: file.resourceId},
      action: kFimidaraPermissionActionsMap.readFile,
      access: false,
      entityId:
        agentType === kFimidaraResourceType.Public
          ? workspace.publicPermissionGroupId
          : sessionAgent.agentId,
    });

    try {
      const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      await readFile(instData);
    } catch (error) {
      expect((error as Error)?.name).toBe(PermissionDeniedError.name);
    }
  });

  skTest.run(
    'reads file from other entries if primary entry is not present',
    async () => {
      const {userToken, rawUser} = await insertUserForTest();
      const {workspace} = await insertWorkspaceForTest(userToken);
      const {file} = await insertFileForTest(userToken, workspace, {
        filepath: generateTestFilepathString({rootname: workspace.rootname}),
      });
      const {mount} = await insertFileBackendMountForTest(userToken, workspace, {
        folderpath: stringifyFoldernamepath(
          {namepath: file.namepath.slice(0, -1)},
          workspace.rootname
        ),
      });

      await kSemanticModels.utils().withTxn(async opts => {
        const entry = newWorkspaceResource<ResolvedMountEntry>(
          makeUserSessionAgent(rawUser, userToken),
          kFimidaraResourceType.ResolvedMountEntry,
          workspace.resourceId,
          /** seed */ {
            mountId: mount.resourceId,
            forType: kFimidaraResourceType.Folder,
            forId: file.resourceId,
            backendNamepath: file.namepath,
            backendExt: file.ext,
            fimidaraNamepath: file.namepath,
            fimidaraExt: file.ext,
            persisted: {
              mountId: mount.resourceId,
              encoding: file.encoding,
              mimetype: file.mimetype,
              size: file.size,
              lastUpdatedAt: file.lastUpdatedAt,
              filepath: stringifyFilenamepath(file),
              raw: undefined,
            },
          }
        );

        await kSemanticModels.resolvedMountEntry().insertItem(entry, opts);
      }, /** reuse async local txn */ false);

      const testBuffer = Buffer.from('Reading from secondary mount source');
      const testStream = Readable.from([testBuffer]);
      kRegisterUtilsInjectables.fileProviderResolver(forMount => {
        if (mount.resourceId === forMount.resourceId) {
          class SecondaryFileProvider
            extends NoopFilePersistenceProviderContext
            implements FilePersistenceProvider
          {
            readFile = async (): Promise<PersistedFile> => ({
              body: testStream,
              size: testBuffer.byteLength,
            });
          }

          return new SecondaryFileProvider();
        } else {
          return new NoopFilePersistenceProviderContext();
        }
      });

      const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(instData);
      assertEndpointResultOk(result);

      await expectFileBodyEqual(testBuffer, result.stream);
    }
  );

  skTest.run(
    'returns an empty stream if file exists and backends do not have file',
    async () => {
      const {userToken} = await insertUserForTest();
      const {workspace} = await insertWorkspaceForTest(userToken);
      const {file} = await insertFileForTest(userToken, workspace, {
        filepath: generateTestFilepathString({rootname: workspace.rootname}),
      });

      kRegisterUtilsInjectables.fileProviderResolver(() => {
        return new NoopFilePersistenceProviderContext();
      });

      const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(instData);
      assertEndpointResultOk(result);

      const testBuffer = Buffer.from([]);
      await expectFileBodyEqual(testBuffer, result.stream);
    }
  );
});
