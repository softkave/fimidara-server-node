import {merge, pick} from 'lodash';
import {kPermissionAgentTypes} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {ByteCounterPassThroughStream} from '../../../utils/streams';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {
  getFileBackendForFile,
  insertResolvedMountEntries,
} from '../../fileBackends/mountUtils';
import {FileNotWritableError} from '../errors';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  assertFile,
  createAndInsertNewFile,
  fileExtractor,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
  stringifyFilenamepath,
} from '../utils';
import {UploadFileEndpoint} from './types';
import {checkUploadFileAuth} from './utils';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async instData => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const createFileResult = await kSemanticModels.utils().withTxn(async opts => {
    let file = await getFileWithMatcher(data, opts);
    const workspace = await getWorkspaceFromFileOrFilepath(file, data.filepath);

    if (file) {
      await checkUploadFileAuth(
        agent,
        workspace,
        file,
        /** parent folder not needed for an existing file */ null,
        opts
      );

      appAssert(file.isWriteAvailable, new FileNotWritableError());
      file = await kSemanticModels
        .file()
        .getAndUpdateOneById(file.resourceId, {isWriteAvailable: false}, opts);
    } else {
      appAssert(data.filepath, new ValidationError('Provide a filepath for new files.'));
      const pathinfo = getFilepathInfo(data.filepath);
      const file = await createAndInsertNewFile(agent, workspace, pathinfo, data, opts);
      await checkUploadFileAuth(agent, workspace, file, null, opts);
      return {file};
    }

    assertFile(file);
    return {file, workspace};
  });

  let {file} = createFileResult;
  const {primaryMount, primaryBackend} = await getFileBackendForFile(file);

  try {
    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);

    // TODO: should we wait here, cause it may take a while
    let update = await primaryBackend.uploadFile({
      mount: primaryMount,
      workspaceId: file.workspaceId,
      filepath: stringifyFilenamepath(file),
      body: bytesCounterStream,
    });
    update = {
      ...update,
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      lastUpdatedAt: getTimestamp(),
      size: bytesCounterStream.contentLength,
      isWriteAvailable: true,
      isReadAvailable: true,
      version: file.version + 1,
    };
    merge(update, pick(data, ['description', 'encoding', 'mimetype']));

    file = await kSemanticModels.utils().withTxn(async opts => {
      const [savedFile] = await Promise.all([
        kSemanticModels.file().getAndUpdateOneById(file.resourceId, update, opts),
        insertResolvedMountEntries({
          agent,
          resource: file,
          mountIds: [primaryMount.resourceId],
        }),
      ]);

      assertFile(savedFile);
      return savedFile;
    });

    assertFile(file);
    return {file: fileExtractor(file)};
  } catch (error) {
    await kSemanticModels.utils().withTxn(async opts => {
      await kSemanticModels
        .file()
        .getAndUpdateOneById(file.resourceId, {isWriteAvailable: true}, opts);
    });

    throw error;
  }
};

export default uploadFile;
