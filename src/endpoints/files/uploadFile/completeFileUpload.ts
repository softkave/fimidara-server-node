import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File} from '../../../definitions/file.js';
import {
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend.js';
import {
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {pathExtract} from '../../../utils/fns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {assertFile} from '../utils.js';
import {getFinalFileUpdate} from './update.js';
import {handleFinalStorageUsageRecords} from './usage.js';

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

  await kIjxSemantic.resolvedMountEntry().insertItem(newMountEntry, opts);
}

async function completeUploadFile(params: {
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

  return await kIjxSemantic.utils().withTxn(async opts => {
    const {namepath, ext} = pathExtract(pMountData.filepath);
    const [savedFile] = await Promise.all([
      kIjxSemantic.file().getAndUpdateOneById(file.resourceId, update, opts),
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

export async function completeFileUpload(params: {
  requestId: string;
  sessionAgent: SessionAgent;
  file: File;
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>;
  size: number;
  primaryMount: FileBackendMount;
  pMountData: FilePersistenceUploadFileResult<unknown>;
}) {
  const {requestId, sessionAgent, file, data, size, primaryMount, pMountData} =
    params;

  const agent = getActionAgentFromSessionAgent(sessionAgent);
  const update = getFinalFileUpdate({
    agent: sessionAgent,
    file,
    data,
    size,
  });

  const [_unused, updatedFile] = await Promise.all([
    handleFinalStorageUsageRecords({
      requestId,
      agent,
      file,
      size,
    }),
    completeUploadFile({
      agent: sessionAgent,
      file,
      primaryMount,
      pMountData,
      update,
      shouldInsertMountEntry: true,
    }),
  ]);

  return updatedFile;
}
