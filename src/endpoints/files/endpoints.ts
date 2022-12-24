import {IPublicFile} from '../../definitions/user';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  orUndefined,
} from '../../mddoc/mddoc';
import {fReusables, httpHeaderItems, httpResponseItems} from '../endpoints';
import {IBaseEndpointResult} from '../types';
import {IGetFileEndpointParams, IGetFileEndpointResult} from './getFile/types';
import {IGetWorkspaceFilesEndpointParams, IGetWorkspaceFilesEndpointResult} from './getWorkspaceFiles/types';
import {IRemoveFileEndpointParams} from './removeFile/types';
import {
  IUpdateFilePermissionGroupsEndpointParams,
  IUpdateFilePermissionGroupsEndpointResult,
} from './updateFilePermissionGroups/types';

const file = new FieldObject<IPublicFile>().setName('File').setFields({
  resourceId: fReusables.id,
  firstName: fReusables.firstName,
  lastName: fReusables.lastName,
  email: fReusables.emailAddress,
  workspaceId: fReusables.workspaceId,
  joinedAt: fReusables.date,
  permissionGroups: fReusables.assignPermissionGroupList,
});

const getWorkspaceFilesParams = new FieldObject<IGetWorkspaceFilesEndpointParams>()
  .setName('GetWorkspaceFilesEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true);

const getWorkspaceFilesResult = new FieldObject<IGetWorkspaceFilesEndpointResult & IBaseEndpointResult>()
  .setName('GetWorkspaceFilesEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    files: orUndefined(new FieldArray().setType(file)),
  })
  .setRequired(true)
  .setDescription('Get workspace collaboration requests endpoint result');

const updateFilePermissionGroupsParams = new FieldObject<IUpdateFilePermissionGroupsEndpointParams>()
  .setName('UpdateFileEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    fileId: fReusables.id,
    permissionGroups: fReusables.assignPermissionGroupList,
  })
  .setRequired(true);

const updateFilePermissionGroupsResult = new FieldObject<
  IUpdateFilePermissionGroupsEndpointResult & IBaseEndpointResult
>()
  .setName('UpdateFileEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    file: orUndefined(file),
  })
  .setRequired(true)
  .setDescription('Update collaboration request endpoint result');

const getFileParams = new FieldObject<IGetFileEndpointParams>()
  .setName('GetFileEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    fileId: fReusables.id,
  })
  .setRequired(true);

const getFileResult = new FieldObject<IGetFileEndpointResult & IBaseEndpointResult>()
  .setName('GetFileEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    file: orUndefined(file),
  })
  .setRequired(true)
  .setDescription('Get collaboration request endpoint result');

const removeFileParams = new FieldObject<IRemoveFileEndpointParams>()
  .setName('RevokeFileEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    fileId: fReusables.id,
  })
  .setRequired(true);

export const getFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/getFile')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getFileParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getFileResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const uploadFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/uploadFile')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getFileParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getFileResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getFileDetailsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/getFileDetails')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getFileParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getFileResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const updateFileDetailsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/updateFileDetails')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateFilePermissionGroupsParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(updateFilePermissionGroupsResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const removeFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/deleteFile')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(removeFileParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(httpResponseItems.defaultResponse)
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);
