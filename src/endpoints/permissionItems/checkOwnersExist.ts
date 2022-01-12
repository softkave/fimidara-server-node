import {
  ISessionAgent,
  AppResourceType,
  BasicCRUDActions,
} from '../../definitions/system';
import {waitOnPromises} from '../../utilities/waitOnPromises';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import FileQueries from '../files/queries';
import FolderQueries from '../folders/queries';
import {checkOrganizationExists} from '../organizations/utils';

interface IPermissionOwner {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
}

export default async function checkOwnersExist(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  items: Array<IPermissionOwner>,
  organizationChecked = false
) {
  const ownerFiles: Array<string> = [];
  const ownerFolders: Array<string> = [];
  const ownerOrganizations: Array<string> = [];

  items.forEach(item => {
    switch (item.permissionOwnerType) {
      case AppResourceType.Organization:
        ownerOrganizations.push(item.permissionOwnerId);
        break;
      case AppResourceType.Folder:
        ownerFolders.push(item.permissionOwnerId);
        break;
      case AppResourceType.File:
        ownerFiles.push(item.permissionOwnerId);
        break;
      default:
        throw new InvalidRequestError(
          `Resource type ${item.permissionOwnerType} is not a valid permission item owner`
        );
    }
  });

  if (ownerOrganizations.length > 1) {
    throw new InvalidRequestError(
      'More than one permission owner of organization type provided, ' +
        'permission items can only belong to a single organization'
    );
  }

  if (ownerOrganizations.length && ownerOrganizations[0] !== organizationId) {
    throw new InvalidRequestError(
      'Provided organization type permission owner and the provided organization do not match'
    );
  }

  if (!organizationChecked) {
    await checkOrganizationExists(context, organizationId);
  }

  const [folders, files] = await Promise.all([
    context.data.folder.getManyItems(
      FolderQueries.getByMultipleIds(ownerFolders)
    ),
    context.data.file.getManyItems(FileQueries.getByMultipleIds(ownerFiles)),
  ]);

  const checkFoldersPermissionQueue = folders.map(item =>
    checkAuthorization(
      context,
      agent,
      organizationId,
      item.resourceId,
      AppResourceType.Folder,
      makeBasePermissionOwnerList(organizationId),
      BasicCRUDActions.Read
    )
  );

  const checkFilesPermissionQueue = files.map(item =>
    checkAuthorization(
      context,
      agent,
      organizationId,
      item.resourceId,
      AppResourceType.File,
      makeBasePermissionOwnerList(organizationId),
      BasicCRUDActions.Read
    )
  );

  await waitOnPromises(checkFoldersPermissionQueue);
  await waitOnPromises(checkFilesPermissionQueue);
}
