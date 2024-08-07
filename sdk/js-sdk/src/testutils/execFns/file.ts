import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints.js';
import {
  DeleteFileEndpointParams,
  FileMatcher,
  GetFileDetailsEndpointParams,
  ReadFileEndpointParams,
  UpdateFileDetailsEndpointParams,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
} from '../../publicTypes.js';
import {
  FimidaraEndpointResult,
  FimidaraEndpointWithBinaryResponseParamsOptional,
  fimidaraAddRootnameToPath,
  stringifyFimidaraFilenamepath,
} from '../../utils.js';
import {
  ITestVars,
  getTestFileByteLength,
  getTestFileReadStream,
} from '../utils.js';

export async function deleteFileTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteFileEndpointParams> = {}
) {
  const input = await getTestFilepath(endpoint, vars, props);
  return await endpoint.files.deleteFile({
    body: merge({filepath: input.filepath}, props),
  });
}

export async function getFileDetailsTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetFileDetailsEndpointParams> = {}
) {
  const input = await getTestFilepath(endpoint, vars, props);
  const result = await endpoint.files.getFileDetails({
    body: merge({filepath: input.filepath}, props),
  });
  return result;
}

export async function updateFileDetailsTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateFileDetailsEndpointParams> = {}
) {
  const {filepath} = await getTestFilepath(endpoint, vars, props);
  const input = {
    filepath,
    file: {
      description: faker.lorem.sentence(),
      mimetype: faker.system.mimeType(),
    },
  };
  const result = await endpoint.files.updateFileDetails({
    body: merge(input, props),
  });
  return result;
}

export async function readFileTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<
    FimidaraEndpointWithBinaryResponseParamsOptional<ReadFileEndpointParams>
  > = {},
  uploadFileProps: PartialDeep<UploadFileEndpointParams> = {}
) {
  const input = await getTestFilepath(
    endpoint,
    vars,
    props.body,
    uploadFileProps
  );
  const params: ReadFileEndpointParams = {filepath: input.filepath};
  const mergedParams = merge({body: params, responseType: 'blob'}, props);
  const result = await endpoint.files.readFile(mergedParams);
  return result;
}

export async function uploadFileTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UploadFileEndpointParams> = {}
) {
  const input: UploadFileEndpointParams = {
    size: await getTestFileByteLength(vars),
    data: getTestFileReadStream(vars),
    description: faker.lorem.sentence(),
    encoding: 'base64',
    filepath: fimidaraAddRootnameToPath(
      faker.system.filePath(),
      vars.workspaceRootname
    ),
    mimetype: faker.system.mimeType(),
  };

  if (props.data && !props.size) {
    throw new Error('Provide size & data');
  }

  const body = merge(input, props);
  const result = await endpoint.files.uploadFile({body});
  return result;
}

export async function getTestFilepath(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: FileMatcher = {},
  uploadFileProps: PartialDeep<UploadFileEndpointParams> = {}
) {
  let filepath = props.filepath;
  let uploadFileResult:
    | FimidaraEndpointResult<UploadFileEndpointResult>
    | undefined;

  if (!filepath && !props.fileId) {
    const uploadFileResult = await uploadFileTestExecFn(
      endpoint,
      vars,
      uploadFileProps
    );
    filepath = stringifyFimidaraFilenamepath(
      uploadFileResult.body.file,
      vars.workspaceRootname
    );
  }

  assert(filepath);
  return {filepath, uploadFileResult};
}
