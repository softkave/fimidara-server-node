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

export async function writeFileParts(params: {
  agent: SessionAgent | Agent;
  workspaceId: string;
  fileId: string;
  parts: InputFilePart[];
  opts: SemanticProviderMutationParams | null;
}): Promise<FilePart[]> {
  const parts = params.parts.map(inputPart =>
    newWorkspaceResource<FilePart>(
      params.agent,
      kFimidaraResourceType.filePart,
      params.workspaceId,
      {
        fileId: params.fileId,
        part: inputPart.part,
        size: inputPart.size,
        multipartId: inputPart.multipartId,
        partId: inputPart.partId,
      }
    )
  );

  await kIjxSemantic.utils().withTxn(async opts => {
    await kIjxSemantic.filePart().insertItem(parts, opts);
  }, params.opts ?? undefined);

  return parts;
}
