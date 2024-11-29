import {isNumber, pick} from 'lodash-es';
import {
  FilePersistenceUploadFileResult,
  FilePersistenceUploadPartResult,
} from '../../../contexts/file/types.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File} from '../../../definitions/file.js';
import {
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend.js';
import {
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {mergeData, pathExtract} from '../../../utils/fns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {ByteCounterPassThroughStream} from '../../../utils/streams.js';
import {assertFile} from '../utils.js';
import {getNextMultipartTimeout} from '../utils/getNextMultipartTimeout.js';
import {writePartMetas} from '../utils/partMeta.js';
import {getCleanupMultipartFileUpdate} from './clean.js';
import {UploadFileEndpointParams} from './types.js';

export async function setFileWritable(fileId: string) {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .file()
      .getAndUpdateOneById(fileId, {isWriteAvailable: true}, opts);
  });
}

export async function insertFileMountEntry(params: {
  agent: SessionAgent;
  file: File;
  primaryMount: FileBackendMount;
  persistedMountData: FilePersistenceUploadFileResult<unknown>;
  namepath: string[];
  ext: string;
  opts: SemanticProviderMutationParams;
}) {
  const {agent, file, primaryMount, persistedMountData, namepath, ext, opts} =
    params;

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

export async function updateFile(params: {
  agent: SessionAgent;
  file: File;
  primaryMount: FileBackendMount;
  persistedMountData: FilePersistenceUploadFileResult<unknown>;
  update: Partial<File>;
  shouldInsertMountEntry: boolean;
}) {
  const {
    agent,
    file,
    primaryMount,
    persistedMountData,
    update,
    shouldInsertMountEntry,
  } = params;

  return await kSemanticModels.utils().withTxn(async opts => {
    const {namepath, ext} = pathExtract(persistedMountData.filepath);
    const [savedFile] = await Promise.all([
      kSemanticModels.file().getAndUpdateOneById(file.resourceId, update, opts),
      shouldInsertMountEntry &&
        insertFileMountEntry({
          agent,
          file,
          primaryMount,
          persistedMountData,
          namepath,
          ext,
          opts,
        }),
    ]);

    assertFile(savedFile);
    return savedFile;
  });
}

export async function saveFilePartData(params: {
  pMountData: FilePersistenceUploadFileResult<unknown>;
}) {
  const {pMountData} = params;
  appAssert(isNumber(pMountData.part));
  appAssert(pMountData.multipartId && pMountData.partId && pMountData.size);
  await writePartMetas({
    multipartId: pMountData.multipartId,
    parts: [
      {
        part: pMountData.part,
        multipartId: pMountData.multipartId,
        partId: pMountData.partId,
        size: pMountData.size,
      },
    ],
  });
}

export function getFileUpdate(params: {
  agent: SessionAgent;
  file: File;
  data: UploadFileEndpointParams;
  isMultipart: boolean;
  hasPart: boolean;
  part?: FilePersistenceUploadPartResult | null;
  persistedMountData: FilePersistenceUploadFileResult<unknown>;
  bytesCounterStream: ByteCounterPassThroughStream;
}): {update: Partial<File>; isLastPart: boolean} {
  const {
    agent,
    file,
    data,
    isMultipart,
    hasPart,
    part,
    persistedMountData,
    bytesCounterStream,
  } = params;
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
    update.multipartTimeout = getNextMultipartTimeout();
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

    mergeData(update, getCleanupMultipartFileUpdate());
  }

  mergeData(update, pick(data, ['description', 'encoding', 'mimetype']), {
    arrayUpdateStrategy: 'replace',
  });

  return {update, isLastPart};
}
