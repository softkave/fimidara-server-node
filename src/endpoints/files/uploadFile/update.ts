import {isNumber, pick} from 'lodash-es';
import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {File} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {mergeData} from '../../../utils/fns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {getCleanupMultipartFileUpdate} from '../deleteFile/deleteMultipartUpload.js';
import {getNextMultipartTimeout} from '../utils/getNextMultipartTimeout.js';
import {writeMultipartUploadPartMetas} from '../utils/multipartUploadMeta.js';

export async function setFileWritable(fileId: string) {
  await kIjxSemantic.utils().withTxn(async opts => {
    await kIjxSemantic
      .file()
      .getAndUpdateOneById(fileId, {isWriteAvailable: true}, opts);
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

export function getIntermediateMultipartFileUpdate(params: {
  agent: SessionAgent;
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>;
  multipartId: string;
}) {
  const {agent, data, multipartId} = params;
  const update: Partial<File> = {
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    lastUpdatedAt: getTimestamp(),
    isWriteAvailable: false,
    multipartTimeout: getNextMultipartTimeout(),
    internalMultipartId: multipartId,
  };

  mergeData(update, pick(data, ['description', 'encoding', 'mimetype']), {
    arrayUpdateStrategy: 'replace',
  });

  return update;
}

export function getFinalFileUpdate(params: {
  agent: SessionAgent;
  file: Pick<File, 'version'>;
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>;
  size: number;
}) {
  const {agent, file, data, size} = params;
  const update: Partial<File> = {
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    lastUpdatedAt: getTimestamp(),
    isWriteAvailable: true,
    isReadAvailable: true,
    version: file.version + 1,
    size,
  };

  mergeData(
    update,
    {
      ...getCleanupMultipartFileUpdate(),
      ...pick(data, ['description', 'encoding', 'mimetype']),
    },
    {arrayUpdateStrategy: 'replace'}
  );

  return update;
}
