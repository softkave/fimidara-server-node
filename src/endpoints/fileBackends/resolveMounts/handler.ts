import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {InvalidRequestError} from '../../errors.js';
import {checkFileAuthorization, getFilepathInfo} from '../../files/utils.js';
import {
  checkFolderAuthorization,
  getFolderpathInfo,
} from '../../folders/utils.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {resolveMountsForFolder} from '../mountUtils.js';
import {fileBackendMountListExtractor} from '../utils.js';
import {ResolveFileBackendMountsEndpoint} from './types.js';
import {resolveWorkspaceFileBackendMountJoiSchema} from './validation.js';

const resolveFileBackendMounts: ResolveFileBackendMountsEndpoint =
  async reqData => {
    const fileModel = kSemanticModels.file();
    const data = validate(
      reqData.data,
      resolveWorkspaceFileBackendMountJoiSchema
    );
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    let fileOrFolder: Pick<File, 'workspaceId' | 'namepath' | 'idPath'> | null =
      null;

    if (data.folderpath) {
      const pathinfo = getFolderpathInfo(data.folderpath, {
        containsRootname: true,
        allowRootFolder: false,
      });
      fileOrFolder = await kSemanticModels.folder().getOneByNamepath({
        workspaceId,
        namepath: pathinfo.namepath,
      });
    } else if (data.filepath) {
      const pathinfo = getFilepathInfo(data.filepath, {
        containsRootname: true,
        allowRootFolder: false,
      });
      fileOrFolder = await fileModel.getOneByNamepath({
        workspaceId,
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
        kFimidaraPermissionActions.readFolder,
        workspaceId
      );
    } else if (data.fileId || data.filepath) {
      appAssert(fileOrFolder, kReuseableErrors.file.notFound());
      checkFileAuthorization(
        agent,
        fileOrFolder,
        kFimidaraPermissionActions.readFile,
        workspaceId
      );
    }

    appAssert(fileOrFolder);
    const {mounts} = await resolveMountsForFolder(fileOrFolder);

    return {
      mounts: fileBackendMountListExtractor(mounts),
    };
  };

export default resolveFileBackendMounts;
