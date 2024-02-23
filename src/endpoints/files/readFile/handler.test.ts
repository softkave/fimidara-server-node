import {Readable} from 'stream';
import {pathJoin, streamToBuffer} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {FilePersistenceProvider, PersistedFile} from '../../contexts/file/types';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register';
import {insertResolvedMountEntries} from '../../fileBackends/mountUtils';
import {addRootnameToPath, stringifyFoldernamepath} from '../../folders/utils';
import NoopFilePersistenceProviderContext from '../../testUtils/context/file/NoopFilePersistenceProviderContext';
import {
  generateTestFileName,
  generateTestFilepathString,
} from '../../testUtils/generate/file';
import {expectFileBodyEqual, expectFileBodyEqualById} from '../../testUtils/helpers/file';
import {completeTests, softkaveTest} from '../../testUtils/helpers/testFns';
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
  softkaveTest.run('file returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);

    await expectFileBodyEqualById(file.resourceId, result.stream);
  });

  softkaveTest.run('file resized', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const startWidth = 500;
    const startHeight = 500;
    const {file} = await insertFileForTest(userToken, workspace, {}, 'png', {
      width: startWidth,
      height: startHeight,
    });

    const expectedWidth = 300;
    const expectedHeight = 300;
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        filepath: stringifyFilenamepath(file, workspace.rootname),
        imageResize: {
          width: expectedWidth,
          height: expectedHeight,
        },
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

  softkaveTest.run('can read file from public folder', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    // Make public folder
    const {folder} = await insertFolderForTest(userToken, workspace);
    await insertPermissionItemsForTest(userToken, workspace.resourceId, {
      target: {targetId: folder.resourceId},
      action: 'readFile',
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
  });

  softkaveTest.run('can read public file', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    await insertPermissionItemsForTest(userToken, workspace.resourceId, {
      target: {targetId: file.resourceId},
      action: 'readFile',
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

  softkaveTest.run('cannot read private file', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    let instData: RequestData | null = null;
    try {
      instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      await readFile(instData);
    } catch (error) {
      expect((error as Error)?.name).toBe(PermissionDeniedError.name);
    }
  });

  softkaveTest.run(
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
      await insertResolvedMountEntries({
        agent: makeUserSessionAgent(rawUser, userToken),
        resource: file,
        mountFiles: [
          {
            mountId: mount.resourceId,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            lastUpdatedAt: file.lastUpdatedAt,
          },
        ],
      });

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

  softkaveTest.run(
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
