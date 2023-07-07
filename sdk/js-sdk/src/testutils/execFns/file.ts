import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints';
import {
  DeleteFileEndpointParams,
  FileMatcher,
  GetFileDetailsEndpointParams,
  ReadFileEndpointParams,
  UpdateFileDetailsEndpointParams,
  UploadFileEndpointParams,
} from '../../publicTypes';
import {
  FimidaraEndpointWithBinaryResponseParamsOptional,
  fimidaraAddRootnameToPath,
  stringifyFimidaraFileNamePath,
} from '../../utils';
import {ITestVars, getTestFileReadStream} from '../utils';

export async function deleteFileTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteFileEndpointParams> = {}
) {
  const input: DeleteFileEndpointParams = await getTestFilepath(
    endpoint,
    vars,
    props
  );
  return await endpoint.files.deleteFile({body: merge(input, props)});
}

export async function getFileDetailsTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetFileDetailsEndpointParams> = {}
) {
  const input: GetFileDetailsEndpointParams = await getTestFilepath(
    endpoint,
    vars,
    props
  );
  const result = await endpoint.files.getFileDetails({
    body: merge(input, props),
  });
  return result;
}

export async function updateFileDetailsTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateFileDetailsEndpointParams> = {}
) {
  const {filepath} = await getTestFilepath(endpoint, vars, props);
  const input: UpdateFileDetailsEndpointParams = {
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
  const input: ReadFileEndpointParams = await getTestFilepath(
    endpoint,
    vars,
    props.body,
    uploadFileProps
  );
  const result = await endpoint.files.readFile(
    merge({body: input, responseType: 'blob'}, props)
  );
  return result;
}

export async function uploadFileTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UploadFileEndpointParams> = {}
) {
  const input: UploadFileEndpointParams = {
    data: getTestFileReadStream(vars),
    description: faker.lorem.sentence(),
    encoding: 'base64',
    filepath: fimidaraAddRootnameToPath(
      faker.system.filePath(),
      vars.workspaceRootname
    ),
    mimetype: faker.system.mimeType(),
  };
  const result = await endpoint.files.uploadFile({
    body: merge(input, props),
  });
  return result;
}

async function getTestFilepath(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: FileMatcher = {},
  uploadFileProps: PartialDeep<UploadFileEndpointParams> = {}
) {
  let filepath = props.filepath;

  if (!filepath && !props.fileId) {
    const file = await uploadFileTestExecFn(endpoint, vars, uploadFileProps);
    filepath = stringifyFimidaraFileNamePath(
      file.body.file,
      vars.workspaceRootname
    );
  }

  return {filepath};
}
