import {pick} from 'lodash';
import {File} from '../../../definitions/file';
import {ResolvedMountEntry} from '../../../definitions/fileBackend';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {SessionAgent, kFimidaraResourceType} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {mergeData, pathExtract} from '../../../utils/fns';
import {newWorkspaceResource} from '../../../utils/resource';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {ByteCounterPassThroughStream} from '../../../utils/streams';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils';
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
  agent: SessionAgent,
  workspace: Workspace,
  pathinfo: FilepathInfo,
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>,
  opts: SemanticProviderMutationParams,
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
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  // eslint-disable-next-line prefer-const
  let {file, isNewFile} = await kSemanticModels.utils().withTxn(async opts => {
    // eslint-disable-next-line prefer-const
    let {file, presignedPath} = await getFileWithMatcher({
      opts,
      matcher: data,
      incrementPresignedPathUsageCount: true,
      presignedPathAction: kFimidaraPermissionActionsMap.uploadFile,
      supportPresignedPath: true,
    });
    const workspace = await getWorkspaceFromFileOrFilepath(file, data.filepath);
    let isNewFile: boolean;

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
      isNewFile = false;
    } else {
      appAssert(data.filepath, new ValidationError('Provide a filepath for new files'));
      const pathinfo = getFilepathInfo(data.filepath, {
        containsRootname: true,
        allowRootFolder: false,
      });
      const file = await createAndInsertNewFile(agent, workspace, pathinfo, data, opts);
      await checkUploadFileAuth(agent, workspace, file, null, opts);
      isNewFile = true;
    }

    assertFile(file);
    return {file, workspace, isNewFile};
  }, /** reuseTxn */ false);

  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** init primary backend only */ true
  );

  try {
    let mountEntry: ResolvedMountEntry | undefined | null;

    if (!isNewFile) {
      mountEntry = await kSemanticModels
        .resolvedMountEntry()
        .getOneByMountIdAndFileId(primaryMount.resourceId, file.resourceId);
    }

    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);

    // TODO: should we wait here, cause it may take a while
    const persistedMountData = await primaryBackend.uploadFile({
      mount: primaryMount,
      workspaceId: file.workspaceId,
      filepath: stringifyFilenamepath(
        mountEntry
          ? {namepath: mountEntry?.backendNamepath, ext: mountEntry?.backendExt}
          : file
      ),
      fileId: file.resourceId,
      body: bytesCounterStream,
    });
    const update: Partial<File> = {
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
      const {namepath, ext} = pathExtract(persistedMountData.filepath);
      const newMountEntry = newWorkspaceResource<ResolvedMountEntry>(
        agent,
        kFimidaraResourceType.ResolvedMountEntry,
        file.workspaceId,
        /** seed */ {
          mountId: primaryMount.resourceId,
          forType: kFimidaraResourceType.File,
          forId: file.resourceId,
          backendNamepath: namepath,
          backendExt: ext,
          fimidaraNamepath: file.namepath,
          fimidaraExt: file.ext,
          persisted: {
            mountId: primaryMount.resourceId,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            lastUpdatedAt: file.lastUpdatedAt,
            raw: persistedMountData.raw,
            filepath: persistedMountData.filepath,
          },
        }
      );

      const [savedFile] = await Promise.all([
        kSemanticModels.file().getAndUpdateOneById(file.resourceId, update, opts),
        kSemanticModels.resolvedMountEntry().insertItem(newMountEntry, opts),
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
