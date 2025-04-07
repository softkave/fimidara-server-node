import {isNumber, isString} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
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
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';
import {
  completeFileUpload,
  completePartialFileUpload,
} from './completeFileUpload.js';
import {prepareFileForUpload} from './prepare.js';
import {UploadFileEndpoint, UploadFileEndpointParams} from './types.js';
import {setFileWritable} from './update.js';
import {handleIntermediateStorageUsageRecords} from './usage.js';
import {uploadFileJoiSchema} from './validation.js';

async function handleUploadFile(params: {
  file: FileWithRuntimeData;
  data: UploadFileEndpointParams;
  agent: SessionAgent;
  reqData: RequestData<UploadFileEndpointParams>;
}) {
  const {data, agent, reqData} = params;
  let file = params.file;
  const isMultipart = isString(data.clientMultipartId);
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs({
    file,
    initPrimaryBackendOnly: true,
  });

  try {
    const mountFilepath = await prepareMountFilepath({primaryMount, file});
    if (isMultipart) {
      appAssert(
        isNumber(data.part),
        new InvalidRequestError('part is required for multipart uploads')
      );
      appAssert(
        file.internalMultipartId,
        new InvalidRequestError('File has no pending multipart upload.')
      );
    }

    const byteCounter = new ByteCounterPassThroughStream();
    data.data.pipe(byteCounter);
    const persistedMountData = await primaryBackend.uploadFile({
      filepath: mountFilepath,
      workspaceId: file.workspaceId,
      body: byteCounter,
      fileId: file.resourceId,
      mount: primaryMount,
      part: data.part,
      multipartId: file.internalMultipartId,
    });

    const size = byteCounter.contentLength;
    await handleIntermediateStorageUsageRecords({
      requestId: reqData.requestId,
      sessionAgent: agent,
      file,
      size,
    });

    if (isMultipart) {
      file = await completePartialFileUpload({
        sessionAgent: agent,
        file,
        data,
        size,
        primaryMount,
        persistedMountData,
      });
    } else {
      file = await completeFileUpload({
        requestId: reqData.requestId,
        agent,
        file,
        data,
        size,
        primaryMount,
        persistedMountData,
      });
    }

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

  const {file} = await prepareFileForUpload({data, agent});
  const isMultipart = isString(data.clientMultipartId);
  if (isMultipart) {
    appAssert(
      data.part,
      new InvalidRequestError('part is required for multipart uploads')
    );

    return await kIjxUtils.redlock().using(
      `upload-file-${file.resourceId}-${data.part}`,
      /** durationMs */ 10 * 60 * 1000, // 10 minutes
      () => handleUploadFile({file, data, agent, reqData})
    );
  } else {
    return handleUploadFile({file, data, agent, reqData});
  }
};

export default uploadFile;
