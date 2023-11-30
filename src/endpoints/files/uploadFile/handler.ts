import {merge, pick} from 'lodash';
import {File} from '../../../definitions/file';
import {AppResourceTypeMap, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {ByteCounterPassThroughStream} from '../../../utils/streams';
import {validate} from '../../../utils/validate';
import {kSemanticModels} from '../../contexts/injectables';
import {getFileBackendForFile} from '../../fileBackends/mountUtils';
import {ensureFolders} from '../../folders/utils';
import {FileNotWritableError} from '../errors';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  assertFile,
  fileExtractor,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
  stringifyFilenamepath,
} from '../utils';
import {UploadFileEndpoint} from './types';
import {checkUploadFileAuth} from './utils';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const result01 = await kSemanticModels.utils().withTxn(async opts => {
    let file = await getFileWithMatcher(data, opts);
    const workspace = await getWorkspaceFromFileOrFilepath(file, data.filepath);

    if (file) {
      await checkUploadFileAuth(
        context,
        agent,
        workspace,
        file,
        /** parent folder not needed for an existing file */ null,
        opts
      );

      appAssert(file.isWriteAvailable, new FileNotWritableError());
      file = await context.semantic.file.getAndUpdateOneById(
        file.resourceId,
        {isWriteAvailable: false},
        opts
      );
    } else {
      appAssert(data.filepath, new ValidationError('Provide a filepath for new files.'));
      const pathinfo = getFilepathInfo(data.filepath);
      const parentFolder = await ensureFolders(
        agent,
        workspace,
        pathinfo.parentPath,
        opts
      );

      await checkUploadFileAuth(
        context,
        agent,
        workspace,
        /** file */ null,
        parentFolder,
        opts
      );

      const fileId = getNewIdForResource(AppResourceTypeMap.File);
      file = newWorkspaceResource<File>(
        agent,
        AppResourceTypeMap.File,
        workspace.resourceId,
        {
          workspaceId: workspace.resourceId,
          resourceId: fileId,
          extension: pathinfo.extension,
          name: pathinfo.filenameExcludingExt,
          idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
          namepath: parentFolder
            ? parentFolder.namepath.concat(pathinfo.filenameExcludingExt)
            : [pathinfo.filenameExcludingExt],
          parentId: parentFolder?.resourceId ?? null,
          size: 0,
          isWriteAvailable: false,
          isReadAvailable: false,
          version: 0,
          description: data.description,
          encoding: data.encoding,
          mimetype: data.mimetype,
        }
      );

      await context.semantic.file.insertItem(file, opts);
    }

    assertFile(file);
    return {file, workspace};
  });

  let {file} = result01;

  const {mount, provider: backend} = await getFileBackendForFile(file);

  try {
    const bytesCounterStream = new ByteCounterPassThroughStream();
    data.data.pipe(bytesCounterStream);

    let update = await backend.uploadFile({
      mount,
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
      const savedFile = await context.semantic.file.getAndUpdateOneById(
        file.resourceId,
        update,
        opts
      );
      assertFile(savedFile);
      return savedFile;
    });

    assertFile(file);
    return {file: fileExtractor(file)};
  } catch (error) {
    await kSemanticModels.utils().withTxn(async opts => {
      await context.semantic.file.getAndUpdateOneById(
        file.resourceId,
        {isWriteAvailable: true},
        opts
      );
    });

    throw error;
  }
};

export default uploadFile;
