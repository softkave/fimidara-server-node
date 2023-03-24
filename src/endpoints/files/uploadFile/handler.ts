import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {
  AppActionType,
  AppResourceType,
  ISessionAgent,
  PERMISSION_AGENT_TYPES,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {ValidationError} from '../../../utils/errors';
import {newWorkspaceResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {IBaseContext} from '../../contexts/types';
import {
  insertBandwidthInUsageRecordInput,
  insertStorageUsageRecordInput,
} from '../../usageRecords/utils';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  fileExtractor,
  getWorkspaceFromFileOrFilepath,
  ISplitfilepathWithDetails,
  splitfilepathWithDetails as splitFilepathWithDetails,
} from '../utils';
import {IUploadFileEndpointParams, UploadFileEndpoint} from './types';
import {checkUploadFileAuth, createFileParentFolders} from './utils';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let file = await MemStore.withTransaction(context, async transaction => {
    const opts: ISemanticDataAccessProviderMutationRunOptions = {transaction};
    let file = await getFileWithMatcher(context, data, opts);
    const isNewFile = !file;
    const workspace = await getWorkspaceFromFileOrFilepath(context, file, data.filepath);

    if (!file) {
      appAssert(data.filepath, new ValidationError('File path not provided.'));
      const pathWithDetails = splitFilepathWithDetails(data.filepath);
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
      isNewFile ? undefined : {oldFileSize: file.size}
    );
    await insertBandwidthInUsageRecordInput(
      context,
      instData,
      file,
      isNewFile ? AppActionType.Create : AppActionType.Update
    );

    if (isNewFile) {
      file = await INTERNAL_createFile(context, agent, workspace, data, file, opts);
    } else {
      const pathWithDetails = splitFilepathWithDetails(file.namePath);
      file = await INTERNAL_updateFile(
        context,
        agent,
        workspace,
        pathWithDetails,
        file,
        data,
        opts
      );
    }

    await Promise.all([
      saveResourceAssignedItems(
        context,
        agent,
        workspace,
        file.resourceId,
        data,
        isNewFile ? false : true,
        opts
      ),
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

  file = await populateAssignedTags<IFile>(context, file.workspaceId, file);
  return {file: fileExtractor(file)};
};

async function INTERNAL_updateFile(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails,
  existingFile: IFile,
  data: IUploadFileEndpointParams,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  const file = await context.semantic.file.getAndUpdateOneById(
    existingFile.resourceId,
    {
      ...data,
      extension: data.extension ?? pathWithDetails.extension ?? existingFile.extension,
      size: data.data.length,
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      lastUpdatedAt: getTimestamp(),
    },
    opts
  );

  // if (data.publicAccessAction) {
  //   const items = makeFilePublicAccessOps(file, data.publicAccessAction);
  //   await updatePublicPermissionGroupAccessOps({
  //     context,
  //     agent,
  //     workspace,
  //     items,
  //     opts,
  //     deleteItems: [{target: {targetId: file.resourceId}}],
  //   });
  // }

  return file;
}

function getNewFile(
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails,
  data: IUploadFileEndpointParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewIdForResource(AppResourceType.File);
  const file = newWorkspaceResource<IFile>(agent, AppResourceType.File, workspace.resourceId, {
    workspaceId: workspace.resourceId,
    resourceId: fileId,
    extension: data.extension ?? pathWithDetails.extension ?? '',
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
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: IUploadFileEndpointParams,
  file: IFile,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  await context.semantic.file.insertItem(file, opts);
  // const items = makeFilePublicAccessOps(file, data.publicAccessAction);
  // await updatePublicPermissionGroupAccessOps({context, agent, workspace, opts, items});
  return file;
}

export default uploadFile;
