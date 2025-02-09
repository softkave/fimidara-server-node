import {isNumber, pick} from 'lodash-es';
import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
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
import {getCleanupMultipartFileUpdate} from '../deleteFile/deleteMultipartUpload.js';
import {assertFile} from '../utils.js';
import {getNextMultipartTimeout} from '../utils/getNextMultipartTimeout.js';
import {writeMultipartUploadPartMetas} from '../utils/multipartUploadMeta.js';
import {UploadFileEndpointParams} from './types.js';

export async function setFileWritable(fileId: string) {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .file()
      .getAndUpdateOneById(fileId, {isWriteAvailable: true}, opts);
  });
}

async function insertFileMountEntry(params: {
  agent: SessionAgent;
  file: File;
  primaryMount: FileBackendMount;
  filepath: string;
  namepath: string[];
  ext: string;
  opts: SemanticProviderMutationParams;
  raw: unknown;
}) {
  const {agent, file, primaryMount, filepath, namepath, ext, opts, raw} =
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
        raw,
        filepath,
        lastUpdatedAt: file.lastUpdatedAt,
        mountId: primaryMount.resourceId,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
      },
    }
  );

  await kSemanticModels.resolvedMountEntry().insertItem(newMountEntry, opts);
}

export async function completeUploadFile(params: {
  agent: SessionAgent;
  file: File;
  primaryMount: FileBackendMount;
  pMountData: FilePersistenceUploadFileResult<unknown>;
  update: Partial<File>;
  shouldInsertMountEntry: boolean;
}) {
  const {
    agent,
    file,
    primaryMount,
    pMountData,
    update,
    shouldInsertMountEntry,
  } = params;

  return await kSemanticModels.utils().withTxn(async opts => {
    const {namepath, ext} = pathExtract(pMountData.filepath);
    const [savedFile] = await Promise.all([
      kSemanticModels.file().getAndUpdateOneById(file.resourceId, update, opts),
      shouldInsertMountEntry &&
        insertFileMountEntry({
          agent,
          file,
          primaryMount,
          namepath,
          ext,
          opts,
          filepath: pMountData.filepath,
          raw: pMountData.raw,
        }),
    ]);

    assertFile(savedFile);
    return savedFile;
  });
}

export async function saveFilePartData(params: {
  pMountData: FilePersistenceUploadFileResult<unknown>;
  size: number;
}) {
  const {pMountData, size} = params;
  appAssert(isNumber(pMountData.part));
  appAssert(pMountData.multipartId && pMountData.partId);

  await writeMultipartUploadPartMetas({
    multipartId: pMountData.multipartId,
    parts: [
      {
        size,
        part: pMountData.part,
        multipartId: pMountData.multipartId,
        partId: pMountData.partId,
      },
    ],
  });
}

export function getFileUpdate(params: {
  agent: SessionAgent;
  file: File;
  data: UploadFileEndpointParams;
  isMultipart: boolean;
  isLastPart?: boolean;
  persistedMountData?: FilePersistenceUploadFileResult<unknown>;
  size: number;
}) {
  const {agent, file, data, isMultipart, persistedMountData, size, isLastPart} =
    params;
  const update: Partial<File> = {
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    lastUpdatedAt: getTimestamp(),
  };

  if (isMultipart && !isLastPart) {
    appAssert(persistedMountData);
    update.internalMultipartId = persistedMountData.multipartId;
    update.isWriteAvailable = false;
    update.multipartTimeout = getNextMultipartTimeout();
  } else {
    update.isWriteAvailable = true;
    update.isReadAvailable = true;
    update.version = file.version + 1;
    update.size = size;

    mergeData(update, getCleanupMultipartFileUpdate());
  }

  mergeData(update, pick(data, ['description', 'encoding', 'mimetype']), {
    arrayUpdateStrategy: 'replace',
  });

  return update;
}
