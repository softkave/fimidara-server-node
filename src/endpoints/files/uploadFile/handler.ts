import {isNumber, isString} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {FileWithRuntimeData} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {ByteCounterPassThroughStream} from '../../../utils/streams.js';
import {validate} from '../../../utils/validate.js';
import RequestData from '../../RequestData.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {fileExtractor} from '../utils.js';
import {handleMultipartCleanup} from './clean.js';
import {
  getExistingFilePartMeta,
  handleLastMultipartUpload,
} from './multipart.js';
import {prepareFile, prepareFilepath} from './prepare.js';
import {UploadFileEndpoint, UploadFileEndpointParams} from './types.js';
import {
  getFileUpdate,
  saveFilePartData,
  setFileWritable,
  updateFile,
} from './update.js';
import {handleStorageUsageRecords} from './usage.js';
import {uploadFileJoiSchema} from './validation.js';

async function handleUploadFile(params: {
  file: FileWithRuntimeData;
  data: UploadFileEndpointParams;
  agent: SessionAgent;
  isNewFile: boolean;
  reqData: RequestData<UploadFileEndpointParams>;
}) {
  const {data, agent, isNewFile, reqData} = params;
  let {file} = params;
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** initPrimaryBackendOnly */ true
  );

  try {
    const isMultipart = isString(data.clientMultipartId);
    const [filepath, {part, hasPart}] = await Promise.all([
      prepareFilepath({isNewFile, primaryMount, file}),
      getExistingFilePartMeta({file, part: data.part}),
    ]);

    handleMultipartCleanup({
      primaryBackend,
      primaryMount,
      filepath,
      file: file as FileWithRuntimeData,
    });

    // TODO: compare bytecounter and size input to make sure they match or
    // update usage record
    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);

    const persistedMountData = await primaryBackend.uploadFile({
      filepath,
      workspaceId: file.workspaceId,
      body: bytesCounterStream,
      fileId: file.resourceId,
      mount: primaryMount,
      part: data.part,
      partLength: file.partLength,
      multipartId: file.internalMultipartId,
    });

    const {update, isLastPart} = getFileUpdate({
      agent,
      file,
      data,
      isMultipart,
      hasPart,
      part,
      persistedMountData,
      bytesCounterStream,
    });

    await handleStorageUsageRecords({
      reqData,
      file,
      isNewFile,
      isMultipart,
      isLastPart,
      size: bytesCounterStream.contentLength,
    });

    if (isMultipart) {
      await saveFilePartData({pMountData: persistedMountData});
      if (isLastPart) {
        await handleLastMultipartUpload({
          file,
          primaryBackend,
          primaryMount,
          filepath,
        });
      }
    }

    file = await updateFile({
      agent,
      file,
      primaryMount,
      persistedMountData,
      update,
      shouldInsertMountEntry: !isMultipart || isLastPart,
    });

    return {file: fileExtractor(file)};
  } catch (error) {
    if (!isNumber(data.part)) {
      kUtilsInjectables.promises().forget(setFileWritable(file.resourceId));
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

  // TODO: use a lock on the file using path, because it's still possible to
  // have concurrency issues in the prepare stage. for that, we need to resolve
  // a filepath as quickly as possible and lock on that.

  // eslint-disable-next-line prefer-const
  let {file, isNewFile} = await prepareFile(data, agent);
  const isMultipart = isString(data.clientMultipartId);

  if (isMultipart) {
    return await kUtilsInjectables
      .redlock()
      .using(`upload-file-${file.resourceId}-${data.part}`, 120_000, () =>
        handleUploadFile({file, data, agent, isNewFile, reqData})
      );
  } else {
    return handleUploadFile({file, data, agent, isNewFile, reqData});
  }
};

export default uploadFile;
