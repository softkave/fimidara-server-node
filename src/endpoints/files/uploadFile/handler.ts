import {add} from 'date-fns';
import {isNumber, isString, pick} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File, FileMatcher} from '../../../definitions/file.js';
import {
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {PresignedPath} from '../../../definitions/presignedPath.js';
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
} from '../../usageRecords/usageFns.js';
import {kFileConstants} from '../constants.js';
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
import {deleteParts, hasPartResult, writeParts} from '../utils/part.js';
import {UploadFileEndpoint, UploadFileEndpointParams} from './types.js';
import {checkUploadFileAuth} from './utils.js';
import {uploadFileJoiSchema} from './validation.js';

async function createAndInsertNewFile(
  agent: SessionAgent,
  workspace: Workspace,
  pathinfo: FilepathInfo,
  data: Pick<
    File,
    'description' | 'encoding' | 'mimetype' | 'partLength' | 'clientMultipartId'
  >,
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

async function setFileWritable(fileId: string) {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .file()
      .getAndUpdateOneById(fileId, {isWriteAvailable: true}, opts);
  });
}

function getCleanupMultipartFileData(): Partial<File> {
  return {
    isWriteAvailable: true,
    partLength: null,
    uploadedParts: null,
    internalMultipartId: null,
    clientMultipartId: null,
    multipartTimeout: null,
    uploadedSize: null,
  };
}

async function cleanupMultipartUpload(
  file: File,
  opts: SemanticProviderMutationParams
) {
  const update = getCleanupMultipartFileData();
  await kSemanticModels.file().updateOneById(file.resourceId, update, opts);
  kUtilsInjectables.promises().forget(deleteParts({fileId: file.resourceId}));

  file.RUNTIME_ONLY_shouldCleanupMultipart = true;
  file.RUNTIME_ONLY_internalMultipartId = file.internalMultipartId;
  file.RUNTIME_ONLY_partLength = file.partLength;
  mergeData(file, update);
}

async function checkFileWriteAvailable(
  file: File,
  data: UploadFileEndpointParams,
  opts: SemanticProviderMutationParams
) {
  if (file.isWriteAvailable) {
    return;
  } else if (file.clientMultipartId === data.clientMultipartId) {
    return;
  } else if (file.multipartTimeout && file.multipartTimeout < Date.now()) {
    await cleanupMultipartUpload(file, opts);
    return;
  }

  throw new FileNotWritableError();
}

async function prepareExistingFile(
  agent: SessionAgent,
  workspace: Workspace,
  file: File,
  data: UploadFileEndpointParams,
  presignedPath: PresignedPath | undefined,
  opts: SemanticProviderMutationParams
) {
  await checkFileWriteAvailable(file, data, opts);
  if (!presignedPath) {
    // Permission is already checked if there's a `presignedPath`
    await checkUploadFileAuth(
      agent,
      workspace,
      file,
      /** closestExistingFolder */ null,
      opts
    );
  }

  return await kSemanticModels
    .file()
    .getAndUpdateOneById(file.resourceId, {isWriteAvailable: false}, opts);
}

async function prepareNewFile(
  agent: SessionAgent,
  workspace: Workspace,
  data: UploadFileEndpointParams,
  opts: SemanticProviderMutationParams
) {
  appAssert(
    data.filepath,
    new ValidationError('Provide a filepath for new files')
  );

  const pathinfo = getFilepathInfo(data.filepath, {
    containsRootname: true,
    allowRootFolder: false,
  });
  const {file, parentFolder} = await createAndInsertNewFile(
    agent,
    workspace,
    pathinfo,
    data,
    opts,
    /** seed */ {}
  );

  await checkUploadFileAuth(agent, workspace, file, parentFolder, opts);
  return file;
}

async function tryGetFile(
  data: FileMatcher,
  opts: SemanticProviderMutationParams
) {
  const matched = await getFileWithMatcher({
    presignedPathAction: kFimidaraPermissionActions.uploadFile,
    incrementPresignedPathUsageCount: true,
    supportPresignedPath: true,
    matcher: data,
    opts,
  });

  return matched;
}

async function prepareFile(
  data: UploadFileEndpointParams,
  agent: SessionAgent
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const {file: existingFile, presignedPath} = await tryGetFile(data, opts);
    const workspace = await getWorkspaceFromFileOrFilepath(
      existingFile,
      data.filepath
    );

    let isNewFile: boolean,
      file = existingFile;

    if (file) {
      isNewFile = false;
      file = await prepareExistingFile(
        agent,
        workspace,
        file,
        data,
        presignedPath,
        opts
      );
    } else {
      isNewFile = true;
      file = await prepareNewFile(agent, workspace, data, opts);
    }

    assertFile(file);
    return {file, workspace, isNewFile};
  });
}

async function insertMountEntry(
  agent: SessionAgent,
  file: File,
  primaryMount: FileBackendMount,
  persistedMountData: FilePersistenceUploadFileResult<any>,
  namepath: string[],
  ext: string,
  opts: SemanticProviderMutationParams
) {
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

  kSemanticModels.resolvedMountEntry().insertItem(newMountEntry, opts);
}

async function updateFile(
  agent: SessionAgent,
  file: File,
  primaryMount: FileBackendMount,
  persistedMountData: FilePersistenceUploadFileResult<any>,
  update: Partial<File>,
  shouldInsertMountEntry: boolean
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const {namepath, ext} = pathExtract(persistedMountData.filepath);
    const [savedFile] = await Promise.all([
      kSemanticModels.file().getAndUpdateOneById(file.resourceId, update, opts),
      shouldInsertMountEntry &&
        insertMountEntry(
          agent,
          file,
          primaryMount,
          persistedMountData,
          namepath,
          ext,
          opts
        ),
    ]);

    assertFile(savedFile);
    return savedFile;
  });
}

async function saveFilePartData(
  file: File,
  persistedMountData: FilePersistenceUploadFileResult<any>
) {
  appAssert(isNumber(persistedMountData.part));
  await writeParts({
    fileId: file.resourceId,
    part: persistedMountData.part,
  });
}

const uploadFile: UploadFileEndpoint = async reqData => {
  const data = validate(reqData.data, uploadFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  // eslint-disable-next-line prefer-const
  let {file, isNewFile} = await prepareFile(data, agent);
  // TODO: use sharded runner to process all an once
  await incrementBandwidthInUsageRecord(
    reqData,
    {...file, size: data.size, resourceId: undefined},
    kFimidaraPermissionActions.uploadFile
  );

  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** initPrimaryBackendOnly */ true
  );

  try {
    const isMultipart = isString(data.clientMultipartId);
    const [mountEntry, {part, hasPart}] = await Promise.all([
      !isNewFile &&
        kSemanticModels
          .resolvedMountEntry()
          .getOneByMountIdAndFileId(primaryMount.resourceId, file.resourceId),
      isNumber(data.part)
        ? hasPartResult({fileId: file.resourceId, part: data.part})
        : ({} as Awaited<ReturnType<typeof hasPartResult>>),
    ]);

    const filepath = stringifyFilenamepath(
      mountEntry
        ? {namepath: mountEntry?.backendNamepath, ext: mountEntry?.backendExt}
        : file
    );

    if (file.RUNTIME_ONLY_shouldCleanupMultipart) {
      file.RUNTIME_ONLY_shouldCleanupMultipart = false;
      appAssert(isString(file.RUNTIME_ONLY_internalMultipartId));
      appAssert(isNumber(file.RUNTIME_ONLY_partLength));
      appAssert;
      kUtilsInjectables.promises().forget(
        primaryBackend.cleanupMultipartUpload({
          filepath,
          fileId: file.resourceId,
          multipartId: file.RUNTIME_ONLY_internalMultipartId,
          mount: primaryMount,
          partLength: file.RUNTIME_ONLY_partLength,
          workspaceId: file.workspaceId,
        })
      );
    }

    // TODO: compare bytecounter and size input to make sure they match or
    // update usage record
    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);

    const persistedMountData = await primaryBackend.uploadFile({
      filepath,
      workspaceId: file.workspaceId,
      body: bytesCounterStream,
      fileId: file.resourceId,
      mount: primaryMount,
      part: data.part,
      partLength: file.partLength,
      multipartId: file.internalMultipartId,
    });

    if (!isNewFile) {
      kUtilsInjectables
        .promises()
        .forget(decrementStorageUsageRecord(reqData, file));
    }

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

    const update: Partial<File> = {
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      lastUpdatedAt: getTimestamp(),
    };

    if (isMultipart && !hasPart) {
      update.uploadedParts = (file.uploadedParts || 0) + 1;
    }

    const isLastPart = isMultipart && file.partLength === update.uploadedParts;
    if (isMultipart && !isLastPart) {
      update.internalMultipartId = persistedMountData.multipartId;
      update.isWriteAvailable = false;
      update.multipartTimeout = add(new Date(), {
        seconds: kFileConstants.multipartLockTimeoutSeconds,
      }).getTime();
      update.uploadedSize =
        (file.uploadedSize || 0) + bytesCounterStream.contentLength;

      if (hasPart) {
        appAssert(part);
        update.uploadedSize -= part.size;
      }
    } else {
      update.isWriteAvailable = true;
      update.isReadAvailable = true;
      update.version = file.version + 1;

      if (isMultipart) {
        appAssert(isNumber(file.uploadedSize));
        update.size = file.uploadedSize + bytesCounterStream.contentLength;
      } else {
        update.size = bytesCounterStream.contentLength;
      }

      mergeData(update, getCleanupMultipartFileData());
    }

    mergeData(update, pick(data, ['description', 'encoding', 'mimetype']), {
      arrayUpdateStrategy: 'replace',
    });

    if (isMultipart) {
      await saveFilePartData(file, persistedMountData);
      if (isLastPart) {
        appAssert(isString(file.clientMultipartId));
        appAssert(isNumber(file.partLength));
        await primaryBackend.completeMultipartUpload({
          filepath,
          fileId: file.resourceId,
          multipartId: file.clientMultipartId,
          mount: primaryMount,
          partLength: file.partLength,
          workspaceId: file.workspaceId,
        });
        kUtilsInjectables
          .promises()
          .forget(deleteParts({fileId: file.resourceId}));
      }
    }

    file = await updateFile(
      agent,
      file,
      primaryMount,
      persistedMountData,
      update,
      /** shouldInsertMountEntry */ !isMultipart || isLastPart
    );

    return {file: fileExtractor(file)};
  } catch (error) {
    if (!isNumber(data.part)) {
      kUtilsInjectables.promises().forget(setFileWritable(file.resourceId));
    }

    throw error;
  }
};

export default uploadFile;
