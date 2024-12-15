import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  DeleteFileEndpointParams,
  FileMatcher,
  GetFileDetailsEndpointParams,
  ReadFileEndpointParams,
  UpdateFileDetailsEndpointParams,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
} from '../../endpoints/publicTypes.js';
import {
  fimidaraAddRootnameToPath,
  stringifyFimidaraFilepath,
} from '../../path/index.js';
import {FimidaraEndpointDownloadBinaryOpts} from '../../types.js';
import {ITestVars} from '../utils.common.js';
import {getTestFileByteLength, getTestFileReadStream} from '../utils.node.js';

export async function deleteFileTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteFileEndpointParams> = {}
) {
  const input = await getTestFilepath(endpoint, vars, props);
  return await endpoint.files.deleteFile(
    merge({filepath: input.filepath}, props)
  );
}

export async function getFileDetailsTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetFileDetailsEndpointParams> = {}
) {
  const input = await getTestFilepath(endpoint, vars, props);
  const result = await endpoint.files.getFileDetails(
    merge({filepath: input.filepath}, props)
  );
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
  const result = await endpoint.files.updateFileDetails(merge(input, props));
  return result;
}

export async function readFileTestExecFn<
  TResponseType extends 'blob' | 'stream'
>(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  readFileProps: ReadFileEndpointParams = {},
  readFileOpts: FimidaraEndpointDownloadBinaryOpts<TResponseType>,
  uploadFileProps: PartialDeep<UploadFileEndpointParams> = {}
) {
  const input = await getTestFilepath(
    endpoint,
    vars,
    readFileProps,
    uploadFileProps
  );
  const params: ReadFileEndpointParams = {filepath: input.filepath};
  const result = await endpoint.files.readFile(
    merge(params, readFileProps),
    readFileOpts
  );
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
  const result = await endpoint.files.uploadFile(body);
  return result;
}

export async function getTestFilepath(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: FileMatcher = {},
  uploadFileProps: PartialDeep<UploadFileEndpointParams> = {}
) {
  let filepath = props.filepath;
  let uploadFileResult: UploadFileEndpointResult | undefined;

  if (!filepath && !props.fileId) {
    const uploadFileResult = await uploadFileTestExecFn(
      endpoint,
      vars,
      uploadFileProps
    );
    filepath = stringifyFimidaraFilepath(
      uploadFileResult.file,
      vars.workspaceRootname
    );
  }

  assert(filepath);
  return {filepath, uploadFileResult};
}
