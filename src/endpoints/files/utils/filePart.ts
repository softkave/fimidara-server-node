import {indexArray} from 'softkave-js-utils';
import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {FilePart} from '../../../definitions/file.js';
import {
  Agent,
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {newWorkspaceResource} from '../../../utils/resource.js';

export interface InputFilePart extends FilePersistenceUploadPartResult {
  size: number;
}

async function getExistingFileParts(params: {
  parts: number[];
  multipartId: string;
}): Promise<Record<string, FilePart | undefined>> {
  const parts = await kIjxSemantic.filePart().getManyByMultipartIdAndPart({
    multipartId: params.multipartId,
    part: params.parts,
  });

  return indexArray(parts, {indexer: p => p.part.toString()});
}

async function separateNewAndExistingParts(params: {
  parts: InputFilePart[];
  multipartId: string;
}): Promise<{
  newParts: InputFilePart[];
  existingParts: Array<InputFilePart & {resourceId: string}>;
}> {
  const newParts: InputFilePart[] = [];
  const existingParts: Array<InputFilePart & {resourceId: string}> = [];
  const existingPartRecords = await getExistingFileParts({
    parts: params.parts.map(p => p.part),
    multipartId: params.multipartId,
  });

  for (const part of params.parts) {
    const existingPart = existingPartRecords[part.part.toString()];
    if (existingPart) {
      existingParts.push({...part, resourceId: existingPart.resourceId});
    } else {
      newParts.push(part);
    }
  }

  return {newParts, existingParts};
}

async function insertNewFileParts(params: {
  parts: InputFilePart[];
  opts: SemanticProviderMutationParams;
  agent: SessionAgent | Agent;
  workspaceId: string;
  fileId: string;
}) {
  const parts = params.parts.map(inputPart =>
    newWorkspaceResource<FilePart>(
      params.agent,
      kFimidaraResourceType.filePart,
      params.workspaceId,
      /** seed */ {
        fileId: params.fileId,
        part: inputPart.part,
        size: inputPart.size,
        multipartId: inputPart.multipartId,
        partId: inputPart.partId,
      }
    )
  );

  await kIjxSemantic.filePart().insertItem(parts, params.opts);
}

async function updateExistingFileParts(params: {
  parts: Array<InputFilePart & {resourceId: string}>;
  opts: SemanticProviderMutationParams;
}) {
  // TODO: use bulk update
  await Promise.all(
    params.parts.map(part =>
      kIjxSemantic.filePart().updateOneById(part.resourceId, part, params.opts)
    )
  );
}

export async function writeFileParts(params: {
  agent: SessionAgent | Agent;
  workspaceId: string;
  fileId: string;
  parts: InputFilePart[];
  opts: SemanticProviderMutationParams | null;
  multipartId: string;
}) {
  const {newParts, existingParts} = await separateNewAndExistingParts({
    parts: params.parts,
    multipartId: params.multipartId,
  });

  await kIjxSemantic.utils().withTxn(async opts => {
    await Promise.all([
      insertNewFileParts({
        parts: newParts,
        opts,
        agent: params.agent,
        workspaceId: params.workspaceId,
        fileId: params.fileId,
      }),
      updateExistingFileParts({parts: existingParts, opts}),
    ]);
  }, params.opts ?? undefined);
}
