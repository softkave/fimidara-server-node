import {PublicTag} from '../../definitions/tag';
import {
  FieldArray,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {AddTagEndpointParams, AddTagEndpointResult, NewTagInput} from './addTag/types';
import {tagConstants} from './constants';
import {CountWorkspaceTagsEndpointParams} from './countWorkspaceTags/types';
import {DeleteTagEndpointParams} from './deleteTag/types';
import {GetTagEndpointParams, GetTagEndpointResult} from './getTag/types';
import {
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointResult,
} from './getWorkspaceTags/types';
import {UpdateTagEndpointParams, UpdateTagEndpointResult, UpdateTagInput} from './updateTag/types';

const newTagInput = FieldObject.construct<NewTagInput>()
  .setName('NewTagInput')
  .setFields({
    name: FieldObject.requiredField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
  });

const updateTagInput = FieldObject.construct<UpdateTagInput>()
  .setName('UpdateTagInput')
  .setFields({
    name: FieldObject.optionalField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
  });

const tag = FieldObject.construct<PublicTag>()
  .setName('Tag')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    name: FieldObject.requiredField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
  });

const addTagParams = FieldObject.construct<AddTagEndpointParams>()
  .setName('AddTagEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceId),
    tag: FieldObject.requiredField(newTagInput),
  })
  .setRequired(true)
  .setDescription('Add tag endpoint params.');
const addTagResponseBody = FieldObject.construct<AddTagEndpointResult>()
  .setName('AddTagEndpointResult')
  .setFields({tag: FieldObject.requiredField(tag)})
  .setRequired(true)
  .setDescription('Add tag endpoint success result.');

const getWorkspaceTagsParams = FieldObject.construct<GetWorkspaceTagsEndpointParams>()
  .setName('GetWorkspaceTagsEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    page: FieldObject.optionalField(fReusables.page),
    pageSize: FieldObject.optionalField(fReusables.pageSize),
  })
  .setRequired(true)
  .setDescription('Get workspace tags endpoint params.');
const getWorkspaceTagsResponseBody = FieldObject.construct<GetWorkspaceTagsEndpointResult>()
  .setName('GetWorkspaceTagsEndpointResult')
  .setFields({
    tags: FieldObject.requiredField(FieldArray.construct<PublicTag>().setType(tag)),
    page: FieldObject.requiredField(fReusables.page),
  })
  .setRequired(true)
  .setDescription('Get workspace tags endpoint success result.');

const countWorkspaceTagsParams = FieldObject.construct<CountWorkspaceTagsEndpointParams>()
  .setName('CountWorkspaceTagsEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
  })
  .setRequired(true)
  .setDescription('Count workspace tags endpoint params.');

const updateTagParams = FieldObject.construct<UpdateTagEndpointParams>()
  .setName('UpdateTagEndpointParams')
  .setFields({
    tagId: FieldObject.requiredField(fReusables.id),
    tag: FieldObject.requiredField(updateTagInput),
  })
  .setRequired(true)
  .setDescription('Update tag endpoint params.');
const updateTagResponseBody = FieldObject.construct<UpdateTagEndpointResult>()
  .setName('UpdateTagEndpointResult')
  .setFields({tag: FieldObject.requiredField(tag)})
  .setRequired(true)
  .setDescription('Update tag endpoint success result.');

const getTagParams = FieldObject.construct<GetTagEndpointParams>()
  .setName('UpdateTagEndpointParams')
  .setFields({
    tagId: FieldObject.requiredField(fReusables.id),
  })
  .setRequired(true)
  .setDescription('Get tag endpoint params.');
const getTagResponseBody = FieldObject.construct<GetTagEndpointResult>()
  .setName('UpdateTagEndpointResult')
  .setFields({tag: FieldObject.requiredField(tag)})
  .setRequired(true)
  .setDescription('Get tag endpoint success result.');

const deleteTagParams = FieldObject.construct<DeleteTagEndpointParams>()
  .setName('DeleteTagEndpointParams')
  .setFields({
    tagId: FieldObject.requiredField(fReusables.id),
  })
  .setRequired(true)
  .setDescription('Delete tag endpoint params.');

export const addTagEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: AddTagEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: AddTagEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(tagConstants.routes.addTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addTagParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addTagResponseBody)
  .setName('AddTagEndpoint')
  .setDescription('Add tag endpoint.');

export const getTagEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetTagEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetTagEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(tagConstants.routes.getTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getTagParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getTagResponseBody)
  .setName('GetTagEndpoint')
  .setDescription('Get tag endpoint.');

export const updateTagEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdateTagEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdateTagEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(tagConstants.routes.updateTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateTagParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateTagResponseBody)
  .setName('UpdateTagEndpoint')
  .setDescription('Update tag endpoint.');

export const deleteTagEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeleteTagEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(tagConstants.routes.deleteTag)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteTagParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteTagEndpoint')
  .setDescription('Delete tag endpoint.');

export const getWorkspaceTagsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWorkspaceTagsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspaceTagsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(tagConstants.routes.getWorkspaceTags)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceTagsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceTagsResponseBody)
  .setName('GetWorkspaceTagsEndpoint')
  .setDescription('Get workspace tags endpoint.');

export const countWorkspaceTagsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: CountWorkspaceTagsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: CountItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(tagConstants.routes.countWorkspaceTags)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceTagsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceTagsEndpoint')
  .setDescription('Count workspace tags endpoint.');
