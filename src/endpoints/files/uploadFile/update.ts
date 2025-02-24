import {pick} from 'lodash-es';
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
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';
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
  backendFilepath: string;
  opts: SemanticProviderMutationParams;
  raw: unknown;
}) {
  const {agent, file, primaryMount, backendFilepath, opts, raw} = params;
  const {namepath, ext} = pathExtract(backendFilepath);
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
        filepath: backendFilepath,
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
  update: Partial<File>;
  shouldInsertMountEntry: boolean;
  raw: unknown;
}) {
  const {agent, file, primaryMount, update, shouldInsertMountEntry, raw} =
    params;

  const backendFilepath = await prepareMountFilepath({primaryMount, file});
  return await kSemanticModels.utils().withTxn(async opts => {
    const [savedFile] = await Promise.all([
      kSemanticModels.file().getAndUpdateOneById(file.resourceId, update, opts),
      shouldInsertMountEntry &&
        insertFileMountEntry({
          agent,
          file,
          primaryMount,
          backendFilepath,
          opts,
          raw,
        }),
    ]);

    assertFile(savedFile);
    return savedFile;
  });
}

export function getFileUpdate(params: {
  agent: SessionAgent;
  file: File;
  data: UploadFileEndpointParams;
  multipartId?: string;
  persistedMountData?: FilePersistenceUploadFileResult<unknown>;
  size: number;
}) {
  const {agent, file, data, persistedMountData, size, multipartId} = params;
  const update: Partial<File> = {
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    lastUpdatedAt: getTimestamp(),
  };

  if (multipartId) {
    appAssert(persistedMountData);
    update.multipartId = multipartId;
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
