import {isNumber, isString} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {FileWithRuntimeData} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {ByteCounterPassThroughStream} from '../../../utils/streams.js';
import {validate} from '../../../utils/validate.js';
import RequestData from '../../RequestData.js';
import {InvalidRequestError} from '../../errors.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {kFileConstants} from '../constants.js';
import {fileExtractor} from '../utils.js';
import {writeMultipartUploadPartMetas} from '../utils/multipartUploadMeta.js';
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';
import {fireAndForgetHandleMultipartCleanup} from './multipart.js';
import {prepareFileForUpload} from './prepare.js';
import {UploadFileEndpoint, UploadFileEndpointParams} from './types.js';
import {completeUploadFile, getFileUpdate, setFileWritable} from './update.js';
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
  const {data, agent, reqData} = params;
  let {file} = params;

  const isMultipart = isString(data.multipartId);
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** initPrimaryBackendOnly */ true
  );

  try {
    const mountFilepath = await prepareMountFilepath({primaryMount, file});

    if (isMultipart) {
      appAssert(
        isNumber(data.part),
        new InvalidRequestError('part is required for multipart uploads')
      );
    }

    fireAndForgetHandleMultipartCleanup({
      primaryBackend,
      primaryMount,
      backendFilepath: mountFilepath,
      file: file as FileWithRuntimeData,
    });

    // TODO: compare bytecounter and size input to make sure they match or
    // update usage record
    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);
    const uploadResult = await primaryBackend.uploadFile({
      filepath: mountFilepath,
      workspaceId: file.workspaceId,
      body: bytesCounterStream,
      fileId: file.resourceId,
      mount: primaryMount,
      part: data.part,
      multipartId: data.multipartId,
    });

    const size = bytesCounterStream.contentLength;
    await handleIntermediateStorageUsageRecords({
      reqData,
      file,
      size,
    });

    if (isMultipart) {
      appAssert(
        uploadResult.multipartId &&
          uploadResult.partId &&
          isNumber(uploadResult.part)
      );

      await writeMultipartUploadPartMetas({
        agent,
        fileId: file.resourceId,
        multipartId: uploadResult.multipartId,
        parts: [
          {
            size,
            part: uploadResult.part,
            multipartId: uploadResult.multipartId,
            partId: uploadResult.partId,
          },
        ],
      });
    } else {
      await handleFinalStorageUsageRecords({
        reqData,
        file,
        size,
      });
    }

    const update = getFileUpdate({
      agent,
      file,
      data,
      multipartId: data.multipartId,
      persistedMountData: uploadResult,
      size,
    });

    appAssert(uploadResult);
    file = await completeUploadFile({
      agent,
      file,
      primaryMount,
      raw: uploadResult.raw,
      update,
      shouldInsertMountEntry: !isMultipart,
    });

    return {file: fileExtractor(file)};
  } catch (error) {
    if (!isMultipart) {
      kUtilsInjectables
        .promises()
        .callAndForget(() => setFileWritable(file.resourceId));
    }

    throw error;
  }
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
  let {file, isNewFile} = await prepareFileForUpload(data, agent);
  const isMultipart = isString(data.multipartId);

  if (isNumber(data.part) && isMultipart) {
    const result = await kUtilsInjectables.redlock().using(
      kFileConstants.multipartUploadLockKey(file.resourceId, data.part),
      /** durationMs */ 10 * 60 * 1000, // 10 minutes
      () => handleUploadFile({file, data, agent, isNewFile, reqData})
    );
    return result;
  } else {
    return handleUploadFile({file, data, agent, isNewFile, reqData});
  }
};

export default uploadFile;
