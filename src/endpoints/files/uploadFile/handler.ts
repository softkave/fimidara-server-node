import {pick} from 'lodash-es';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File} from '../../../definitions/file.js';
import {ResolvedMountEntry} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {ValidationError} from '../../../utils/errors.js';
import {mergeData, pathExtract} from '../../../utils/fns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {ByteCounterPassThroughStream} from '../../../utils/streams.js';
import {validate} from '../../../utils/validate.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {
  decrementStorageUsageRecord,
  incrementBandwidthInUsageRecord,
  incrementStorageEverConsumedUsageRecord,
  incrementStorageUsageRecord,
} from '../../usage/usageFns.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {FileNotWritableError} from '../errors.js';
import {getFileWithMatcher} from '../getFilesWithMatcher.js';
import {
  FilepathInfo,
  assertFile,
  createNewFileAndEnsureFolders,
  fileExtractor,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
  stringifyFilenamepath,
} from '../utils.js';
import {UploadFileEndpoint} from './types.js';
import {checkUploadFileAuth} from './utils.js';
import {uploadFileJoiSchema} from './validation.js';

async function createAndInsertNewFile(
  agent: SessionAgent,
  workspace: Workspace,
  pathinfo: FilepathInfo,
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>,
  opts: SemanticProviderMutationParams,
  seed: Partial<File> = {}
) {
  const {file, parentFolder} = await createNewFileAndEnsureFolders(
    agent,
    workspace,
    pathinfo,
    data,
    seed,
    /** parentFolder */ null
  );

  await kSemanticModels.file().insertItem(file, opts);
  return {file, parentFolder};
}

const uploadFileEndpoint: UploadFileEndpoint = async reqData => {
  const data = validate(reqData.data, uploadFileJoiSchema);

  // TODO
  const {agent} = await initEndpoint(reqData, {data});

  // eslint-disable-next-line prefer-const
  let {file, isNewFile} = await kSemanticModels.utils().withTxn(async opts => {
    const matched = await getFileWithMatcher({
      presignedPathAction: kFimidaraPermissionActions.uploadFile,
      incrementPresignedPathUsageCount: true,
      supportPresignedPath: true,
      matcher: data,
      opts,
    });

    let isNewFile: boolean;
    let file = matched.file;
    const presignedPath = matched.presignedPath;
    const workspace = await getWorkspaceFromFileOrFilepath(file, data.filepath);

    if (file) {
      isNewFile = false;
      appAssert(file.isWriteAvailable, new FileNotWritableError());

      if (!presignedPath) {
        // Permission is already checked if there's a `presignedPath`
        await checkUploadFileAuth(
          agent,
          workspace,
          file,
          /** parent folder not needed for an existing file */ null,
          opts
        );
      }

      file = await kSemanticModels
        .file()
        .getAndUpdateOneById(file.resourceId, {isWriteAvailable: false}, opts);
    } else {
      isNewFile = true;
      appAssert(
        data.filepath,
        new ValidationError('Provide a filepath for new files')
      );

      const pathinfo = getFilepathInfo(data.filepath, {
        containsRootname: true,
        allowRootFolder: false,
      });
      const createResult = await createAndInsertNewFile(
        agent,
        workspace,
        pathinfo,
        data,
        opts,
        /** seed */ {}
      );

      file = createResult.file;
      await checkUploadFileAuth(
        agent,
        workspace,
        file,
        createResult.parentFolder,
        opts
      );
    }

    assertFile(file);

    // TODO: use sharded runner to process all an once
    await incrementBandwidthInUsageRecord(
      reqData,
      {...file, size: data.size, resourceId: undefined},
      kFimidaraPermissionActions.uploadFile
    );
    await incrementStorageEverConsumedUsageRecord(
      reqData,
      {...file, size: data.size, resourceId: undefined},
      kFimidaraPermissionActions.uploadFile
    );
    await incrementStorageUsageRecord(
      reqData,
      {...file, size: data.size, resourceId: undefined},
      kFimidaraPermissionActions.uploadFile
    );

    return {file, workspace, isNewFile};
  });

  if (!isNewFile) {
    // TODO: this prolly should be at the end
    kUtilsInjectables
      .promises()
      .forget(decrementStorageUsageRecord(reqData, file));
  }

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

    // TODO: compare bytecounter and size input to make sure they match or
    // update usage record
    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);

    // TODO: should we wait here, cause it may take a while
    const persistedMountData = await primaryBackend.uploadFile({
      filepath: stringifyFilenamepath(
        mountEntry
          ? {namepath: mountEntry?.backendNamepath, ext: mountEntry?.backendExt}
          : file
      ),
      workspaceId: file.workspaceId,
      body: bytesCounterStream,
      fileId: file.resourceId,
      mount: primaryMount,
    });

    const update: Partial<File> = {
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      size: bytesCounterStream.contentLength,
      lastUpdatedAt: getTimestamp(),
      version: file.version + 1,
      isWriteAvailable: true,
      isReadAvailable: true,
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
          forType: kFimidaraResourceType.File,
          mountId: primaryMount.resourceId,
          fimidaraNamepath: file.namepath,
          backendNamepath: namepath,
          forId: file.resourceId,
          fimidaraExt: file.ext,
          backendExt: ext,
          persisted: {
            filepath: persistedMountData.filepath,
            lastUpdatedAt: file.lastUpdatedAt,
            mountId: primaryMount.resourceId,
            raw: persistedMountData.raw,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
          },
        }
      );

      const [savedFile] = await Promise.all([
        kSemanticModels
          .file()
          .getAndUpdateOneById(file.resourceId, update, opts),
        kSemanticModels.resolvedMountEntry().insertItem(newMountEntry, opts),
      ]);

      assertFile(savedFile);
      return savedFile;
    });

    assertFile(file);
    return {file: fileExtractor(file)};
  } catch (error) {
    await kSemanticModels.utils().withTxn(async opts => {
      await kSemanticModels
        .file()
        .getAndUpdateOneById(file.resourceId, {isWriteAvailable: true}, opts);
    });

    throw error;
  }
};

export default uploadFileEndpoint;
