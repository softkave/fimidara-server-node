import {throwFolderNotFound} from '../folders/utils';
import {throwCollaborationRequestNotFound} from '../collaborationRequests/utils';
import {throwFileNotFound} from '../files/utils';
import {throwOrganizationNotFound} from '../organizations/utils';
import {throwPermissionItemNotFound} from '../permissionItems/utils';
import {throwPresetPermissionsGroupNotFound} from '../presetPermissionsGroups/utils';
import {throwUserNotFound, throwUserTokenNotFound} from '../user/utils';
import {throwProgramAccessTokenNotFound} from '../programAccessTokens/utils';
import {throwClientAssignedTokenNotFound} from '../clientAssignedTokens/utils';
import {IBaseContextDataProviders} from './BaseContext';
import MemoryDataProvider from './data-providers/MemoryDataProvider';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IOrganization} from '../../definitions/organization';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IUserToken} from '../../definitions/userToken';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IUser} from '../../definitions/user';
import {IAppRuntimeState} from '../../definitions/system';
import {IDataProvider} from './data-providers/DataProvider';
import {throwNotFound} from '../utils';

export default class MemoryDataProviderContext
  implements IBaseContextDataProviders
{
  public folder = new MemoryDataProvider<IFolder>([], throwFolderNotFound);
  public file = new MemoryDataProvider<IFile>([], throwFileNotFound);
  public clientAssignedToken = new MemoryDataProvider<IClientAssignedToken>(
    [],
    throwClientAssignedTokenNotFound
  );

  public programAccessToken = new MemoryDataProvider<IProgramAccessToken>(
    [],
    throwProgramAccessTokenNotFound
  );

  public permissionItem = new MemoryDataProvider<IPermissionItem>(
    [],
    throwPermissionItemNotFound
  );

  public preset = new MemoryDataProvider<IPresetPermissionsGroup>(
    [],
    throwPresetPermissionsGroupNotFound
  );

  public organization = new MemoryDataProvider<IOrganization>(
    [],
    throwOrganizationNotFound
  );

  public collaborationRequest = new MemoryDataProvider<ICollaborationRequest>(
    [],
    throwCollaborationRequestNotFound
  );

  public user = new MemoryDataProvider<IUser>([], throwUserNotFound);
  public userToken = new MemoryDataProvider<IUserToken>(
    [],
    throwUserTokenNotFound
  );

  public appRuntimeState = new MemoryDataProvider<IAppRuntimeState>(
    [],
    throwNotFound
  );
}
