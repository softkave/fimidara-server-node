import {PublicTag} from '../../definitions/tag.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc.js';
import {AddTagEndpointParams, AddTagEndpointResult} from './addTag/types.js';
import {tagConstants} from './constants.js';
import {CountWorkspaceTagsEndpointParams} from './countWorkspaceTags/types.js';
import {DeleteTagEndpointParams} from './deleteTag/types.js';
import {GetTagEndpointParams, GetTagEndpointResult} from './getTag/types.js';
import {
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointResult,
} from './getWorkspaceTags/types.js';
import {
  AddTagHttpEndpoint,
  CountWorkspaceTagsHttpEndpoint,
  DeleteTagHttpEndpoint,
  GetTagHttpEndpoint,
  GetWorkspaceTagsHttpEndpoint,
  UpdateTagHttpEndpoint,
} from './types.js';
import {
  UpdateTagEndpointParams,
  UpdateTagEndpointResult,
  UpdateTagInput,
} from './updateTag/types.js';

const updateTagInput = mddocConstruct
  .constructFieldObject<UpdateTagInput>()
  .setName('UpdateTagInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
  });

const tag = mddocConstruct
  .constructFieldObject<PublicTag>()
  .setName('Tag')
  .setFields({
    ...fReusables.workspaceResourceParts,
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
  });

const addTagParams = mddocConstruct
  .constructFieldObject<AddTagEndpointParams>()
  .setName('AddTagEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceId
    ),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
  });
const addTagResponseBody = mddocConstruct
  .constructFieldObject<AddTagEndpointResult>()
  .setName('AddTagEndpointResult')
  .setFields({tag: mddocConstruct.constructFieldObjectField(true, tag)});
const getWorkspaceTagsParams = mddocConstruct
  .constructFieldObject<GetWorkspaceTagsEndpointParams>()
  .setName('GetWorkspaceTagsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getWorkspaceTagsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceTagsEndpointResult>()
  .setName('GetWorkspaceTagsEndpointResult')
  .setFields({
    tags: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicTag>().setType(tag)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });
const countWorkspaceTagsParams = mddocConstruct
  .constructFieldObject<CountWorkspaceTagsEndpointParams>()
  .setName('CountWorkspaceTagsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const updateTagParams = mddocConstruct
  .constructFieldObject<UpdateTagEndpointParams>()
  .setName('UpdateTagEndpointParams')
  .setFields({
    tagId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    tag: mddocConstruct.constructFieldObjectField(true, updateTagInput),
  });
const updateTagResponseBody = mddocConstruct
  .constructFieldObject<UpdateTagEndpointResult>()
  .setName('UpdateTagEndpointResult')
  .setFields({tag: mddocConstruct.constructFieldObjectField(true, tag)});
const getTagParams = mddocConstruct
  .constructFieldObject<GetTagEndpointParams>()
  .setName('GetTagEndpointParams')
  .setFields({
    tagId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
const getTagResponseBody = mddocConstruct
  .constructFieldObject<GetTagEndpointResult>()
  .setName('GetTagEndpointResult')
  .setFields({tag: mddocConstruct.constructFieldObjectField(true, tag)});
const deleteTagParams = mddocConstruct
  .constructFieldObject<DeleteTagEndpointParams>()
  .setName('DeleteTagEndpointParams')
  .setFields({
    tagId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
export const addTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<AddTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddTagHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(tagConstants.routes.addTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(addTagResponseBody)
  .setName('AddTagEndpoint');

export const getTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetTagHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(tagConstants.routes.getTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getTagResponseBody)
  .setName('GetTagEndpoint');

export const updateTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<UpdateTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      UpdateTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateTagHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(tagConstants.routes.updateTag)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateTagResponseBody)
  .setName('UpdateTagEndpoint');

export const deleteTagEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteTagHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteTagHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<DeleteTagHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      DeleteTagHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteTagHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeleteTagHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(tagConstants.routes.deleteTag)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteTagParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteTagEndpoint');

export const getWorkspaceTagsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['query']
    >,
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
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getWorkspaceTagsResponseBody)
  .setName('GetWorkspaceTagsEndpoint');

export const countWorkspaceTagsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountWorkspaceTagsHttpEndpoint['mddocHttpDefinition']['query']
    >,
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
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceTagsEndpoint');
