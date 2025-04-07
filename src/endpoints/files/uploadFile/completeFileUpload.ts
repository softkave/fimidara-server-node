import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File} from '../../../definitions/file.js';
import {
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend.js';
import {
  Agent,
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {pathExtract} from '../../../utils/fns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {assertFile} from '../utils.js';
import {
  getFinalFileUpdate,
  getIntermediateMultipartFileUpdate,
  saveFilePartData,
} from './update.js';
import {handleFinalStorageUsageRecords} from './usage.js';

async function insertFileMountEntry(params: {
  agent: Agent;
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

async function updateFileAndInsertMountEntry(params: {
  agent: Agent;
  file: File;
  primaryMount: FileBackendMount;
  persistedMountData: FilePersistenceUploadFileResult<unknown>;
  update: Partial<File>;
  shouldInsertMountEntry: boolean;
  opts: SemanticProviderMutationParams | null;
}) {
  const {
    agent,
    file,
    primaryMount,
    persistedMountData,
    update,
    shouldInsertMountEntry,
    opts,
  } = params;

  return await kIjxSemantic.utils().withTxn(async opts => {
    const {namepath, ext} = pathExtract(persistedMountData.filepath);
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
          filepath: persistedMountData.filepath,
          raw: persistedMountData.raw,
        }),
    ]);

    assertFile(savedFile);
    return savedFile;
  }, opts ?? undefined);
}

export async function completeFileUpload(params: {
  requestId: string;
  agent: Agent;
  file: File;
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>;
  size: number;
  primaryMount: FileBackendMount;
  persistedMountData: FilePersistenceUploadFileResult<unknown>;
}) {
  const {requestId, agent, file, data, size, primaryMount, persistedMountData} =
    params;

  const update = getFinalFileUpdate({
    agent,
    file,
    data,
    size,
  });

  const [, updatedFile] = await Promise.all([
    handleFinalStorageUsageRecords({
      requestId,
      agent,
      file,
      size,
    }),
    updateFileAndInsertMountEntry({
      agent,
      file,
      primaryMount,
      persistedMountData,
      update,
      shouldInsertMountEntry: true,
      opts: null,
    }),
  ]);

  return updatedFile;
}

export async function completePartialFileUpload(params: {
  sessionAgent: SessionAgent;
  file: File;
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>;
  size: number;
  primaryMount: FileBackendMount;
  persistedMountData: FilePersistenceUploadFileResult<unknown>;
}) {
  const {sessionAgent, file, data, size, primaryMount, persistedMountData} =
    params;
  const update = getIntermediateMultipartFileUpdate({
    agent: sessionAgent,
    data,
    multipartId: file.internalMultipartId!,
  });

  const [, updatedFile] = await kIjxSemantic.utils().withTxn(async opts =>
    Promise.all([
      saveFilePartData({
        agent: sessionAgent,
        workspaceId: file.workspaceId,
        fileId: file.resourceId,
        persistedMountData,
        size,
        opts,
      }),
      updateFileAndInsertMountEntry({
        agent: sessionAgent,
        file,
        primaryMount,
        persistedMountData,
        update,
        shouldInsertMountEntry: true,
        opts,
      }),
    ])
  );

  return updatedFile;
}
