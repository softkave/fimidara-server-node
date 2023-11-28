import {merge, pick} from 'lodash';
import {File, FileMountEntry} from '../../../definitions/file';
import {AppResourceTypeMap, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {ByteCounterPassThroughStream} from '../../../utils/streams';
import {validate} from '../../../utils/validate';
import {kSemanticModels} from '../../contexts/injectables';
import {
  defaultMount,
  getFileBackendForFile,
  resolveMountsForFolder,
} from '../../fileBackends/mountUtils';
import {ensureFolders} from '../../folders/utils';
import {FileNotWritableError} from '../errors';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  assertFile,
  fileExtractor,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
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

      const mounts = parentFolder
        ? (await resolveMountsForFolder(parentFolder, opts)).mounts
        : [await defaultMount(workspace.resourceId, opts)];

      const fileId = getNewIdForResource(AppResourceTypeMap.File);
      const mountEntries = mounts.map((mount): FileMountEntry => {
        return {key: fileId, mountId: mount.resourceId};
      });
      file = newWorkspaceResource<File>(
        agent,
        AppResourceTypeMap.File,
        workspace.resourceId,
        {
          mountEntries,
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
        }
      );

      await context.semantic.file.insertItem(file, opts);
    }

    assertFile(file);
    return {file, workspace};
  });

  const {workspace} = result01;
  let {file} = result01;

  const {preferredMountEntry, provider: backend} = await getFileBackendForFile(file);

  try {
    const bytesCounterStream = new ByteCounterPassThroughStream();
    const previousVersion = file.version;
    data.data.pipe(bytesCounterStream);

    let update = await backend.uploadFile({
      key: preferredMountEntry.key,
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
