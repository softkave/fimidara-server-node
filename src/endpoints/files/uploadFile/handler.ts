import {isNumber, isString} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIncludeInProjection} from '../../../contexts/data/types.js';
import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {FileWithRuntimeData} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
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

  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** initPrimaryBackendOnly */ true
  );

  const isMultipart = isString(data.clientMultipartId);
  try {
    const filepath = await prepareFilepath({
      primaryMount,
      file,
    });
    let internalMultipartId: string | undefined;

    if (isMultipart) {
      appAssert(isNumber(data.part));

      const key = `upload-multipart-file-${file.resourceId}`;
      internalMultipartId = await createOrRetrieve<string>({
        key,
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
    }

    fireAndForgetHandleMultipartCleanup({
      primaryBackend,
      primaryMount,
      filepath,
      data,
      file: file as FileWithRuntimeData,
    });

    const isSilentPart = isMultipart && data.part === -1;
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

      file.internalMultipartId = internalMultipartId;
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
    const result = await kUtilsInjectables.redlock().using(
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
