import {PublicTag} from '../../definitions/tag';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {AddTagEndpointParams, AddTagEndpointResult, NewTagInput} from './addTag/types';
import {tagConstants} from './constants';
import {CountWorkspaceTagsEndpointParams} from './countWorkspaceTags/types';
import {DeleteTagEndpointParams} from './deleteTag/types';
import {GetTagEndpointParams, GetTagEndpointResult} from './getTag/types';
import {
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointResult,
} from './getWorkspaceTags/types';
import {
  AddTagHttpEndpoint,
  CountWorkspaceTagsHttpEndpoint,
  DeleteTagHttpEndpoint,
  GetTagHttpEndpoint,
  GetWorkspaceTagsHttpEndpoint,
  UpdateTagHttpEndpoint,
} from './types';
import {
  UpdateTagEndpointParams,
  UpdateTagEndpointResult,
  UpdateTagInput,
} from './updateTag/types';

const newTagInput = mddocConstruct
  .constructFieldObject<NewTagInput>()
  .setName('NewTagInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
  });

const updateTagInput = mddocConstruct
  .constructFieldObject<UpdateTagInput>()
  .setName('UpdateTagInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
  });

const tag = mddocConstruct
  .constructFieldObject<PublicTag>()
  .setName('Tag')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceIdOrNull
    ),
  });

const addTagParams = mddocConstruct
  .constructFieldObject<AddTagEndpointParams>()
  .setName('AddTagEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceId),
    tag: mddocConstruct.constructFieldObjectField(true, newTagInput),
  })
  .setDescription('Add tag endpoint params.');
const addTagResponseBody = mddocConstruct
  .constructFieldObject<AddTagEndpointResult>()
  .setName('AddTagEndpointResult')
  .setFields({tag: mddocConstruct.constructFieldObjectField(true, tag)})
  .setDescription('Add tag endpoint success result.');

const getWorkspaceTagsParams = mddocConstruct
  .constructFieldObject<GetWorkspaceTagsEndpointParams>()
  .setName('GetWorkspaceTagsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
  })
  .setDescription('Get workspace tags endpoint params.');
const getWorkspaceTagsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceTagsEndpointResult>()
  .setName('GetWorkspaceTagsEndpointResult')
  .setFields({
    tags: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicTag>().setType(tag)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  })
  .setDescription('Get workspace tags endpoint success result.');

const countWorkspaceTagsParams = mddocConstruct
  .constructFieldObject<CountWorkspaceTagsEndpointParams>()
  .setName('CountWorkspaceTagsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  })
  .setDescription('Count workspace tags endpoint params.');

const updateTagParams = mddocConstruct
  .constructFieldObject<UpdateTagEndpointParams>()
  .setName('UpdateTagEndpointParams')
  .setFields({
    tagId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    tag: mddocConstruct.constructFieldObjectField(true, updateTagInput),
  })
  .setDescription('Update tag endpoint params.');
const updateTagResponseBody = mddocConstruct
  .constructFieldObject<UpdateTagEndpointResult>()
  .setName('UpdateTagEndpointResult')
  .setFields({tag: mddocConstruct.constructFieldObjectField(true, tag)})
  .setDescription('Update tag endpoint success result.');

const getTagParams = mddocConstruct
  .constructFieldObject<GetTagEndpointParams>()
  .setName('GetTagEndpointParams')
  .setFields({
    tagId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  })
  .setDescription('Get tag endpoint params.');
const getTagResponseBody = mddocConstruct
  .constructFieldObject<GetTagEndpointResult>()
  .setName('GetTagEndpointResult')
  .setFields({tag: mddocConstruct.constructFieldObjectField(true, tag)})
  .setDescription('Get tag endpoint success result.');

const deleteTagParams = mddocConstruct
  .constructFieldObject<DeleteTagEndpointParams>()
  .setName('DeleteTagEndpointParams')
  .setFields({
    tagId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  })
  .setDescription('Delete tag endpoint params.');

export const addTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<AddTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<AddTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<AddTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<AddTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<AddTagHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(tagConstants.routes.addTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addTagResponseBody)
  .setName('AddTagEndpoint')
  .setDescription('Add tag endpoint.');

export const getTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<GetTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<GetTagHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(tagConstants.routes.getTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getTagResponseBody)
  .setName('GetTagEndpoint')
  .setDescription('Get tag endpoint.');

export const updateTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<UpdateTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<UpdateTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<UpdateTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      UpdateTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<UpdateTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<UpdateTagHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(tagConstants.routes.updateTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateTagResponseBody)
  .setName('UpdateTagEndpoint')
  .setDescription('Update tag endpoint.');

export const deleteTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<DeleteTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<DeleteTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<DeleteTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      DeleteTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<DeleteTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<DeleteTagHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(tagConstants.routes.deleteTag)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteTagEndpoint')
  .setDescription('Delete tag endpoint.');

export const getWorkspaceTagsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(tagConstants.routes.getWorkspaceTags)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceTagsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceTagsResponseBody)
  .setName('GetWorkspaceTagsEndpoint')
  .setDescription('Get workspace tags endpoint.');

export const countWorkspaceTagsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(tagConstants.routes.countWorkspaceTags)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceTagsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceTagsEndpoint')
  .setDescription('Count workspace tags endpoint.');
