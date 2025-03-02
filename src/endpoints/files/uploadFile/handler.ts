import {isNumber, isString} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {FileWithRuntimeData} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {ByteCounterPassThroughStream} from '../../../utils/streams.js';
import {validate} from '../../../utils/validate.js';
import RequestData from '../../RequestData.js';
import {InvalidRequestError} from '../../errors.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {fileExtractor} from '../utils.js';
import {prepareFilepath} from '../utils/prepareFilepath.js';
import {
  fireAndForgetHandleMultipartCleanup,
  handleLastMultipartUpload,
} from './multipart.js';
import {prepareFileForUpload} from './prepare.js';
import {queueAddInternalMultipartId} from './queueAddInternalMultipartId.js';
import {UploadFileEndpoint, UploadFileEndpointParams} from './types.js';
import {
  completeUploadFile,
  getFileUpdate,
  saveFilePartData,
  setFileWritable,
} from './update.js';
import {
  handleFinalStorageUsageRecords,
  handleIntermediateStorageUsageRecords,
} from './usage.js';
import {uploadFileJoiSchema} from './validation.js';

async function handleUploadFile(params: {
  file: FileWithRuntimeData;
  data: UploadFileEndpointParams;
  agent: SessionAgent;
  isNewFile: boolean;
  reqData: RequestData<UploadFileEndpointParams>;
}) {
  const {data, agent, reqData, isNewFile} = params;
  let {file} = params;

  const isMultipart = isString(data.clientMultipartId);
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** initPrimaryBackendOnly */ true
  );

  try {
    const filepath = await prepareFilepath({primaryMount, file});
    let internalMultipartId = file.internalMultipartId;
    const isSilentPart = isMultipart && data.part === -1;

    if (isMultipart) {
      appAssert(
        isNumber(data.part),
        new InvalidRequestError('part is required for multipart uploads')
      );

      if (!internalMultipartId) {
        appAssert(
          !isSilentPart,
          new InvalidRequestError('No pending multipart upload')
        );

        const {multipartId} = await queueAddInternalMultipartId({
          agent,
          input: {
            filepath,
            fileId: file.resourceId,
            workspaceId: file.workspaceId,
            mount: {
              backend: primaryMount.backend,
              namepath: primaryMount.namepath,
              resourceId: primaryMount.resourceId,
              mountedFrom: primaryMount.mountedFrom,
            },
            namepath: file.namepath,
          },
        });

        file.internalMultipartId = internalMultipartId = multipartId;
      }
    }

    fireAndForgetHandleMultipartCleanup({
      primaryBackend,
      primaryMount,
      filepath,
      data,
      file: file as FileWithRuntimeData,
    });

    let size = 0;
    let pMountData:
      | Pick<FilePersistenceUploadFileResult<unknown>, 'filepath' | 'raw'>
      | undefined;

    if (isSilentPart) {
      // avoid memory leak by destroying the stream
      data.data.destroy();
    }

    if (!isSilentPart) {
      // TODO: compare bytecounter and size input to make sure they match or
      // update usage record
      const bytesCounterStream = new ByteCounterPassThroughStream();
      data.data.pipe(bytesCounterStream);

      pMountData = await primaryBackend.uploadFile({
        filepath,
        workspaceId: file.workspaceId,
        body: bytesCounterStream,
        fileId: file.resourceId,
        mount: primaryMount,
        part: data.part,
        multipartId: internalMultipartId,
      });

      await handleIntermediateStorageUsageRecords({
        reqData,
        file,
        isNewFile,
        size: bytesCounterStream.contentLength,
      });

      size = bytesCounterStream.contentLength;
    }

    if (isMultipart) {
      if (!isSilentPart) {
        appAssert(pMountData);
        await saveFilePartData({pMountData: pMountData, size});
      }

      if (data.isLastPart) {
        const completePartResult = await handleLastMultipartUpload({
          file,
          primaryBackend,
          primaryMount,
          filepath,
          data,
        });
        size = completePartResult.size;
        pMountData = completePartResult.pMountData;
      }
    }

    await handleFinalStorageUsageRecords({
      reqData,
      file,
      isMultipart,
      size,
      isLastPart: data.isLastPart,
    });

    const update = getFileUpdate({
      agent,
      file,
      data,
      isMultipart,
      persistedMountData: pMountData,
      size,
      isLastPart: data.isLastPart,
    });

    appAssert(pMountData);
    file = await completeUploadFile({
      agent,
      file,
      primaryMount,
      pMountData,
      update,
      shouldInsertMountEntry: !isMultipart || !!data.isLastPart,
    });

    return {file: fileExtractor(file)};
  } catch (error) {
    if (!isMultipart) {
      kIjxUtils
        .promises()
        .callAndForget(() => setFileWritable(file.resourceId));
    }

    throw error;
  }
}

const uploadFile: UploadFileEndpoint = async reqData => {
  const data = validate(reqData.data, uploadFileJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  // TODO: use a lock on the file using path, because it's still possible to
  // have concurrency issues in the prepare stage. for that, we need to resolve
  // a filepath as quickly as possible and lock on that.

  // eslint-disable-next-line prefer-const
  let {file, isNewFile} = await prepareFileForUpload(data, agent);
  const isMultipart = isString(data.clientMultipartId);

  if (isMultipart) {
    const result = await kIjxUtils.redlock().using(
      `upload-file-${file.resourceId}-${data.part}`,
      /** durationMs */ 10 * 60 * 1000, // 10 minutes
      () => handleUploadFile({file, data, agent, isNewFile, reqData})
    );
    return result;
  } else {
    return handleUploadFile({file, data, agent, isNewFile, reqData});
  }
};

export default uploadFile;
