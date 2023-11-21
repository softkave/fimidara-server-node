import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {
  AppResourceTypeMap,
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
import {checkUploadFileAuth, ensureFileParentFolders} from './utils';
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
      const pathinfo = getFilepathInfo(data.filepath);
      const parentFolder = await ensureFileParentFolders(
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
      file = generateNewFile(agent, workspace, pathinfo, data, parentFolder);
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
      isNewFile ? 'addFile' : 'updateFile',
      isNewFile ? undefined : {oldFileSize: file.size},
      opts
    );
    await insertBandwidthInUsageRecordInput(
      context,
      instData,
      file,
      isNewFile ? 'addFile' : 'updateFile',
      opts
    );

    if (isNewFile) {
      file = await insertNewFile(context, file, opts);
    } else {
      file = await updateExistingFile(context, agent, file, data, opts);
    }

    assertFile(file);
    await context.fileBackend.uploadFile({
      bucket: context.appVariables.S3Bucket,
      key: file.resourceId,
      body: data.data,
      contentLength: data.size,
    });

    return file;
  });

  file = await populateAssignedTags<File>(context, file.workspaceId, file);
  return {file: fileExtractor(file)};
};

async function updateExistingFile(
  context: BaseContextType,
  agent: SessionAgent,
  existingFile: File,
  data: UploadFileEndpointParams,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  return await context.semantic.file.getAndUpdateOneById(
    existingFile.resourceId,
    {
      ...data,
      size: data.size,
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      lastUpdatedAt: getTimestamp(),
    },
    opts
  );
}

function generateNewFile(
  agent: SessionAgent,
  workspace: Workspace,
  details: FilepathInfo,
  data: UploadFileEndpointParams,
  parentFolder: Folder | null
) {
  const fileId = getNewIdForResource(AppResourceTypeMap.File);
  return newWorkspaceResource<File>(
    agent,
    AppResourceTypeMap.File,
    workspace.resourceId,
    {
      workspaceId: workspace.resourceId,
      resourceId: fileId,
      extension: details.extension,
      name: details.nameWithoutExtension,
      idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
      namePath: parentFolder
        ? parentFolder.namePath.concat(details.nameWithoutExtension)
        : [details.nameWithoutExtension],
      parentId: parentFolder?.resourceId ?? null,
      size: data.size,
    }
  );
}

async function insertNewFile(
  context: BaseContextType,
  file: File,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  await context.semantic.file.insertItem(file, opts);
  return file;
}

export default uploadFile;
