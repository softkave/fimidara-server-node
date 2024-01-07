import {File} from '../../../definitions/file';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
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
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);

  let fileOrFolder: Pick<File, 'workspaceId' | 'namepath' | 'idPath'> | null = null;

  if (data.folderpath) {
    const pathinfo = getFolderpathInfo(data.folderpath);
    fileOrFolder = await kSemanticModels
      .folder()
      .getOneByNamepath({workspaceId: workspace.resourceId, namepath: pathinfo.namepath});
  } else if (data.filepath) {
    const pathinfo = getFilepathInfo(data.filepath);
    fileOrFolder = await fileModel.getOneByNamepath({
      workspaceId: workspace.resourceId,
      namepath: pathinfo.namepath,
      extension: pathinfo.extension,
    });
  } else if (data.folderId) {
    fileOrFolder = await kSemanticModels.folder().getOneById(data.folderId);
  } else if (data.fileId) {
    fileOrFolder = await fileModel.getOneById(data.fileId);
  } else {
    throw new InvalidRequestError(
      'Provide one of folderpath, folderId, filepath, or fileId.'
    );
  }

  if (data.folderId || data.folderpath) {
    appAssert(fileOrFolder, kReuseableErrors.folder.notFound());
    checkFolderAuthorization(agent, fileOrFolder, kPermissionsMap.readFolder, workspace);
  } else if (data.fileId || data.filepath) {
    appAssert(fileOrFolder, kReuseableErrors.file.notFound());
    checkFileAuthorization(agent, fileOrFolder, kPermissionsMap.readFile);
  }

  appAssert(fileOrFolder);
  const {mounts} = await resolveMountsForFolder(fileOrFolder);

  return {
    mounts: fileBackendMountListExtractor(mounts),
  };
};

export default resolveFileBackendMounts;
