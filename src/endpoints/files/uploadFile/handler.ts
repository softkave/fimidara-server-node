import {isString} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIncludeInProjection} from '../../../contexts/data/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {FileWithRuntimeData} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {createOrRetrieve} from '../../../utils/concurrency/createOrRetrieve.js';
import {ByteCounterPassThroughStream} from '../../../utils/streams.js';
import {validate} from '../../../utils/validate.js';
import RequestData from '../../RequestData.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {fileExtractor} from '../utils.js';
import {prepareFilepath} from '../utils/prepareFilepath.js';
import {
  fireAndForgetHandleMultipartCleanup,
  handleLastMultipartUpload,
} from './multipart.js';
import {prepareFile} from './prepare.js';
import {UploadFileEndpoint, UploadFileEndpointParams} from './types.js';
import {
  completeUploadFile,
  getFileUpdate,
  saveFilePartData,
  setFileWritable,
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

  const isMultipart = isString(data.clientMultipartId);
  try {
    const filepath = await prepareFilepath({primaryMount, file});
    const internalMultipartId = await createOrRetrieve<string>({
      key: `upload-multipart-file-${file.resourceId}`,
      create: async () => {
        const startResult = await primaryBackend.startMultipartUpload({
          filepath,
          workspaceId: file.workspaceId,
          fileId: file.resourceId,
          mount: primaryMount,
        });

        await kSemanticModels.utils().withTxn(async opts => {
          await kSemanticModels
            .file()
            .updateOneById(
              file.resourceId,
              {internalMultipartId: startResult.multipartId},
              opts
            );
        });

        return startResult.multipartId;
      },
      retrieve: async () => {
        if (file.internalMultipartId) {
          return file.internalMultipartId;
        }

        const dbFile = await kSemanticModels
          .file()
          .getOneById(file.resourceId, {
            projection: {internalMultipartId: kIncludeInProjection},
          });

        return dbFile?.internalMultipartId ?? undefined;
      },
    });

    fireAndForgetHandleMultipartCleanup({
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
      multipartId: internalMultipartId,
    });

    await handleStorageUsageRecords({
      reqData,
      file,
      isNewFile,
      isMultipart,
      isLastPart: data.isLastPart,
      size: bytesCounterStream.contentLength,
    });

    let size = bytesCounterStream.contentLength;
    if (isMultipart) {
      await saveFilePartData({pMountData: persistedMountData, size});
      if (data.isLastPart) {
        const lastPartResult = await handleLastMultipartUpload({
          file,
          primaryBackend,
          primaryMount,
          filepath,
        });
        size = lastPartResult.size;
      }
    }

    const update = getFileUpdate({
      agent,
      file,
      data,
      isMultipart,
      persistedMountData,
      size,
      isLastPart: data.isLastPart,
    });

    file = await completeUploadFile({
      agent,
      file,
      primaryMount,
      persistedMountData,
      update,
      shouldInsertMountEntry: !isMultipart || !!data.isLastPart,
    });

    return {file: fileExtractor(file)};
  } catch (error) {
    if (!isMultipart) {
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
    return await kUtilsInjectables.redlock().using(
      `upload-file-${file.resourceId}-${data.part}`,
      /** durationMs */ 10 * 60 * 1000, // 10 minutes
      () => handleUploadFile({file, data, agent, isNewFile, reqData})
    );
  } else {
    return handleUploadFile({file, data, agent, isNewFile, reqData});
  }
};

export default uploadFile;
