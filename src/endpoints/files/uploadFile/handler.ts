import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {
  AppActionType,
  AppResourceType,
  PERMISSION_AGENT_TYPES,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {
  insertBandwidthInUsageRecordInput,
  insertStorageUsageRecordInput,
} from '../../usageRecords/utils';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  FilepathInfo,
  assertFile,
  fileExtractor,
  getFilepathInfo,
  getWorkspaceFromFileOrFilepath,
} from '../utils';
import {UploadFileEndpoint, UploadFileEndpointParams} from './types';
import {checkUploadFileAuth, createFileParentFolders} from './utils';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let file = await context.semantic.utils.withTxn(context, async opts => {
    let {file} = await getFileWithMatcher(context, data, opts);
    const isNewFile = !file;
    const workspace = await getWorkspaceFromFileOrFilepath(context, file, data.filepath);

    if (!file) {
      appAssert(data.filepath, new ValidationError('File path not provided.'));
      const pathWithDetails = getFilepathInfo(data.filepath);
      const parentFolder = await createFileParentFolders(
        context,
        agent,
        workspace,
        pathWithDetails,
        opts
      );
      await checkUploadFileAuth(context, agent, workspace, /** file */ null, parentFolder);
      file = getNewFile(agent, workspace, pathWithDetails, data, parentFolder);
    } else {
      await checkUploadFileAuth(
        context,
        agent,
        workspace,
        file,
        /** parent folder not needed for an existing file */ null
      );
    }

    await insertStorageUsageRecordInput(
      context,
      instData,
      file,
      isNewFile ? AppActionType.Create : AppActionType.Update,
      isNewFile ? undefined : {oldFileSize: file.size},
      opts
    );
    await insertBandwidthInUsageRecordInput(
      context,
      instData,
      file,
      isNewFile ? AppActionType.Create : AppActionType.Update,
      opts
    );

    if (isNewFile) {
      file = await INTERNAL_createFile(context, file, opts);
    } else {
      file = await INTERNAL_updateFile(context, agent, file, data, opts);
    }

    assertFile(file);
    await Promise.all([
      context.fileBackend.uploadFile({
        bucket: context.appVariables.S3Bucket,
        key: file.resourceId,
        body: data.data,
        contentType: data.mimetype,
        contentEncoding: data.encoding,
        contentLength: data.data.byteLength,
      }),
    ]);

    return file;
  });

  file = await populateAssignedTags<File>(context, file.workspaceId, file);
  return {file: fileExtractor(file)};
};

async function INTERNAL_updateFile(
  context: BaseContextType,
  agent: SessionAgent,
  existingFile: File,
  data: UploadFileEndpointParams,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const file = await context.semantic.file.getAndUpdateOneById(
    existingFile.resourceId,
    {
      ...data,
      extension: data.extension ?? existingFile.extension,
      size: data.data.length,
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      lastUpdatedAt: getTimestamp(),
    },
    opts
  );

  return file;
}

function getNewFile(
  agent: SessionAgent,
  workspace: Workspace,
  pathWithDetails: FilepathInfo,
  data: UploadFileEndpointParams,
  parentFolder: Folder | null
) {
  const fileId = getNewIdForResource(AppResourceType.File);
  const file = newWorkspaceResource<File>(agent, AppResourceType.File, workspace.resourceId, {
    workspaceId: workspace.resourceId,
    resourceId: fileId,
    extension: data.extension ?? pathWithDetails.extension,
    name: pathWithDetails.nameWithoutExtension,
    idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
    namePath: parentFolder
      ? parentFolder.namePath.concat(pathWithDetails.nameWithoutExtension)
      : [pathWithDetails.nameWithoutExtension],
    parentId: parentFolder?.resourceId ?? null,
    mimetype: data.mimetype,
    size: data.data.length,
    description: data.description,
    encoding: data.encoding,
  });
  return file;
}

async function INTERNAL_createFile(
  context: BaseContextType,
  file: File,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  await context.semantic.file.insertItem(file, opts);
  return file;
}

export default uploadFile;
