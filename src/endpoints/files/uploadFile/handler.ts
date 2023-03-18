import {IFile} from '../../../definitions/file';
import {BasicCRUDActions, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {ValidationError} from '../../../utils/errors';
import {} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {
  insertBandwidthInUsageRecordInput,
  insertStorageUsageRecordInput,
} from '../../usageRecords/utils';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  fileExtractor,
  getWorkspaceFromFileOrFilepath,
  splitfilepathWithDetails as splitFilepathWithDetails,
} from '../utils';
import {getNewFile, internalCreateFile} from './internalCreateFile';
import {internalUpdateFile} from './internalUpdateFile';
import {UploadFileEndpoint} from './types';
import {checkUploadFileAuth, createFileParentFolders} from './utils';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  await MemStore.withTransaction(context, async transaction => {
    const opts: ISemanticDataAccessProviderMutationRunOptions = {transaction};
    let file = await getFileWithMatcher(context, data, opts);
    const isNewFile = !file;
    const workspace = await getWorkspaceFromFileOrFilepath(context, file, data.filepath);

    if (!file) {
      appAssert(data.filepath, new ValidationError('File path missing'));
      const pathWithDetails = splitFilepathWithDetails(data.filepath);
      const parentFolder = await createFileParentFolders(
        context,
        agent,
        workspace,
        pathWithDetails,
        opts
      );
      await checkUploadFileAuth(context, agent, workspace, null, parentFolder);
      file = getNewFile(agent, workspace, pathWithDetails, data, parentFolder);
    } else {
      await checkUploadFileAuth(context, agent, workspace, file, null);
    }

    await insertStorageUsageRecordInput(
      context,
      instData,
      file,
      isNewFile ? BasicCRUDActions.Create : BasicCRUDActions.Update,
      isNewFile ? undefined : {oldFileSize: file.size}
    );
    await insertBandwidthInUsageRecordInput(
      context,
      instData,
      file,
      isNewFile ? BasicCRUDActions.Create : BasicCRUDActions.Update
    );

    if (isNewFile) {
      file = await internalCreateFile(context, agent, workspace, data, file);
    } else {
      const pathWithDetails = splitFilepathWithDetails(file.namePath);
      file = await internalUpdateFile(context, agent, workspace, pathWithDetails, file, data);
    }

    await context.fileBackend.uploadFile({
      bucket: context.appVariables.S3Bucket,
      key: file.resourceId,
      body: data.data,
      contentType: data.mimetype,
      contentEncoding: data.encoding,
      contentLength: data.data.byteLength,
    });
  });

  file = await populateAssignedTags<IFile>(context, file.workspaceId, file);
  return {file: fileExtractor(file)};
};

export default uploadFile;
