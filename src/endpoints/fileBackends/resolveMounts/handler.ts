import {File} from '../../../definitions/file';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {InvalidRequestError} from '../../errors';
import {checkFileAuthorization, getFilepathInfo} from '../../files/utils';
import {checkFolderAuthorization, getFolderpathInfo} from '../../folders/utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {resolveMountsForFolder} from '../mountUtils';
import {fileBackendMountListExtractor} from '../utils';
import {ResolveFileBackendMountsEndpoint} from './types';
import {resolveWorkspaceFileBackendMountJoiSchema} from './validation';

const resolveFileBackendMounts: ResolveFileBackendMountsEndpoint = async instData => {
  const fileModel = kSemanticModels.file();
  const data = validate(instData.data, resolveWorkspaceFileBackendMountJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);

  let fileOrFolder: Pick<File, 'workspaceId' | 'namepath' | 'idPath'> | null = null;

  if (data.folderpath) {
    const pathinfo = getFolderpathInfo(data.folderpath, {
      containsRootname: true,
      allowRootFolder: false,
    });
    fileOrFolder = await kSemanticModels
      .folder()
      .getOneByNamepath({workspaceId: workspace.resourceId, namepath: pathinfo.namepath});
  } else if (data.filepath) {
    const pathinfo = getFilepathInfo(data.filepath, {
      containsRootname: true,
      allowRootFolder: false,
    });
    fileOrFolder = await fileModel.getOneByNamepath({
      workspaceId: workspace.resourceId,
      namepath: pathinfo.namepath,
      ext: pathinfo.ext,
    });
  } else if (data.folderId) {
    fileOrFolder = await kSemanticModels.folder().getOneById(data.folderId);
  } else if (data.fileId) {
    fileOrFolder = await fileModel.getOneById(data.fileId);
  } else {
    throw new InvalidRequestError(
      'Provide one of folderpath, folderId, filepath, or fileId'
    );
  }

  if (data.folderId || data.folderpath) {
    appAssert(fileOrFolder, kReuseableErrors.folder.notFound());
    checkFolderAuthorization(
      agent,
      fileOrFolder,
      kFimidaraPermissionActionsMap.readFolder,
      workspace
    );
  } else if (data.fileId || data.filepath) {
    appAssert(fileOrFolder, kReuseableErrors.file.notFound());
    checkFileAuthorization(agent, fileOrFolder, kFimidaraPermissionActionsMap.readFile);
  }

  appAssert(fileOrFolder);
  const {mounts} = await resolveMountsForFolder(fileOrFolder);

  return {
    mounts: fileBackendMountListExtractor(mounts),
  };
};

export default resolveFileBackendMounts;
