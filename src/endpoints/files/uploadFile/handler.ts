import {pick} from 'lodash';
import {File} from '../../../definitions/file';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {Agent, kPermissionAgentTypes} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {mergeData} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {ByteCounterPassThroughStream} from '../../../utils/streams';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {SemanticProviderMutationTxnOptions} from '../../contexts/semantic/types';
import {
  insertResolvedMountEntries,
  resolveBackendsMountsAndConfigs,
} from '../../fileBackends/mountUtils';
import {FileNotWritableError} from '../errors';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  FilepathInfo,
  assertFile,
  createNewFileAndEnsureFolders,
  fileExtractor,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
  stringifyFilenamepath,
} from '../utils';
import {UploadFileEndpoint} from './types';
import {checkUploadFileAuth} from './utils';
import {uploadFileJoiSchema} from './validation';

async function createAndInsertNewFile(
  agent: Agent,
  workspace: Workspace,
  pathinfo: FilepathInfo,
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>,
  opts: SemanticProviderMutationTxnOptions,
  seed: Partial<File> = {}
) {
  const file = await createNewFileAndEnsureFolders(
    agent,
    workspace,
    pathinfo,
    data,
    opts,
    seed
  );

  await kSemanticModels.file().insertItem(file, opts);
  return file;
}

const uploadFile: UploadFileEndpoint = async instData => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const createFileResult = await kSemanticModels.utils().withTxn(async opts => {
    // eslint-disable-next-line prefer-const
    let {file, presignedPath} = await getFileWithMatcher({
      opts,
      matcher: data,
      incrementPresignedPathUsageCount: true,
      presignedPathAction: kPermissionsMap.uploadFile,
      supportPresignedPath: true,
    });
    const workspace = await getWorkspaceFromFileOrFilepath(file, data.filepath);

    if (file && !presignedPath) {
      // Permission is already checked if there's a `presignedPath`
      await checkUploadFileAuth(
        agent,
        workspace,
        file,
        /** parent folder not needed for an existing file */ null,
        opts
      );

      appAssert(file.isWriteAvailable, new FileNotWritableError());
      file = await kSemanticModels
        .file()
        .getAndUpdateOneById(file.resourceId, {isWriteAvailable: false}, opts);
    } else {
      appAssert(data.filepath, new ValidationError('Provide a filepath for new files'));
      const pathinfo = getFilepathInfo(data.filepath);
      const file = await createAndInsertNewFile(agent, workspace, pathinfo, data, opts);
      await checkUploadFileAuth(agent, workspace, file, null, opts);
      return {file};
    }

    assertFile(file);
    return {file, workspace};
  }, /** reuseTxn */ false);

  let {file} = createFileResult;
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** init primary backend only */ true
  );

  try {
    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);

    // TODO: should we wait here, cause it may take a while
    let update = await primaryBackend.uploadFile({
      mount: primaryMount,
      workspaceId: file.workspaceId,
      filepath: stringifyFilenamepath(file),
      body: bytesCounterStream,
    });
    update = {
      ...update,
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      lastUpdatedAt: getTimestamp(),
      size: bytesCounterStream.contentLength,
      isWriteAvailable: true,
      isReadAvailable: true,
      version: file.version + 1,
    };
    mergeData(update, pick(data, ['description', 'encoding', 'mimetype']), {
      arrayUpdateStrategy: 'replace',
    });

    file = await kSemanticModels.utils().withTxn(async opts => {
      const [savedFile] = await Promise.all([
        kSemanticModels.file().getAndUpdateOneById(file.resourceId, update, opts),
        insertResolvedMountEntries({
          agent,
          resource: file,
          mountFiles: [
            {
              mountId: primaryMount.resourceId,
              encoding: file.encoding,
              mimetype: file.mimetype,
              size: file.size,
              lastUpdatedAt: file.lastUpdatedAt,
            },
          ],
        }),
      ]);

      assertFile(savedFile);
      return savedFile;
    }, /** reuseTxn */ false);

    assertFile(file);
    return {file: fileExtractor(file)};
  } catch (error) {
    await kSemanticModels.utils().withTxn(async opts => {
      await kSemanticModels
        .file()
        .getAndUpdateOneById(file.resourceId, {isWriteAvailable: true}, opts);
    }, /** reuseTxn */ false);

    throw error;
  }
};

export default uploadFile;
