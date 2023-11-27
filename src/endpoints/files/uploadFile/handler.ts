import {merge, pick} from 'lodash';
import {container} from 'tsyringe';
import {File} from '../../../definitions/file';
import {AppResourceTypeMap, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {ByteCounterPassThroughStream} from '../../../utils/streams';
import {validate} from '../../../utils/validate';
import {FileBackendProvider} from '../../contexts/file/types';
import {kInjectionKeys} from '../../contexts/injectionKeys';
import {FileNotWritableError} from '../errors';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  assertFile,
  fileExtractor,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
} from '../utils';
import {UploadFileEndpoint} from './types';
import {checkUploadFileAuth, ensureFoldersWithPathInfo} from './utils';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const result01 = await context.semantic.utils.withTxn(context, async opts => {
    let {file} = await getFileWithMatcher(context, data, opts);
    const workspace = await getWorkspaceFromFileOrFilepath(context, file, data.filepath);

    if (file) {
      await checkUploadFileAuth(
        context,
        agent,
        workspace,
        file,
        /** parent folder not needed for an existing file */ null
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
      const parentFolder = await ensureFoldersWithPathInfo(
        context,
        agent,
        workspace,
        pathinfo,
        opts
      );
      await checkUploadFileAuth(
        context,
        agent,
        workspace,
        /** file */ null,
        parentFolder
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
          namePath: parentFolder
            ? parentFolder.namePath.concat(pathinfo.filenameExcludingExt)
            : [pathinfo.filenameExcludingExt],
          parentId: parentFolder?.resourceId ?? null,
          size: 0,
          isWriteAvailable: false,
          isReadAvailable: false,
          version: 0,
        }
      );

      await context.semantic.file.insertItem(file, opts);
    }

    return {file, workspace};
  });

  const {workspace} = result01;
  let {file} = result01;
  const backend = container.resolve<FileBackendProvider>(
    kInjectionKeys.fileBackend.fimidara
  );

  try {
    assertFile(file);
    const bytesCounterStream = new ByteCounterPassThroughStream();
    const previousVersion = file.version;
    data.data.pipe(bytesCounterStream);

    let update = await backend.persistFile({
      file,
      data: bytesCounterStream,
      isFileVersioningEnabled: workspace.enableFileVersioning,
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

    file = await context.semantic.utils.withTxn(context, async opts => {
      assertFile(file);
      return await context.semantic.file.getAndUpdateOneById(
        file.resourceId,
        update,
        opts
      );
    });

    assertFile(file);

    if (!workspace.enableFileVersioning) {
      await backend.deleteVersion({file, version: previousVersion});
    }

    return {file: fileExtractor(file)};
  } catch (error) {
    await context.semantic.utils.withTxn(context, async opts => {
      assertFile(file);
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
