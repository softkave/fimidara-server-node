import {throwFolderNotFound} from '../folders/utils';
import {throwCollaborationRequestNotFound} from '../collaborationRequests/utils';
import {throwFileNotFound} from '../files/utils';
import {throwWorkspaceNotFound} from '../workspaces/utils';
import {throwPermissionItemNotFound} from '../permissionItems/utils';
import {throwPresetPermissionsGroupNotFound} from '../presetPermissionsGroups/utils';
import {throwUserNotFound, throwUserTokenNotFound} from '../user/utils';
import {throwProgramAccessTokenNotFound} from '../programAccessTokens/utils';
import {throwClientAssignedTokenNotFound} from '../clientAssignedTokens/utils';
import {IBaseContextDataProviders} from './BaseContext';
import MemoryDataProvider from './data-providers/MemoryDataProvider';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IWorkspace} from '../../definitions/workspace';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IUserToken} from '../../definitions/userToken';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IUser} from '../../definitions/user';
import {IAppRuntimeState} from '../../definitions/system';
import {throwNotFound} from '../utils';
import {ITag} from '../../definitions/tag';
import {throwTagNotFound} from '../tags/utils';
import {IAssignedItem} from '../../definitions/assignedItem';
import {throwAssignedItemNotFound} from '../assignedItems/utils';

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

  public workspace = new MemoryDataProvider<IWorkspace>(
    [],
    throwWorkspaceNotFound
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

  public tag = new MemoryDataProvider<ITag>([], throwTagNotFound);
  public assignedItem = new MemoryDataProvider<IAssignedItem>(
    [],
    throwAssignedItemNotFound
  );
}
