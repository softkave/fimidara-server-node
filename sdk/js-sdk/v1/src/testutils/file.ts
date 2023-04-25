import {faker} from '@faker-js/faker';
import {createReadStream} from 'fs';
import {merge} from 'lodash';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../public-endpoints';
import {
  DeleteFileEndpointParams,
  GetFileDetailsEndpointParams,
  ReadFileEndpointParams,
  UpdateFileDetailsEndpointParams,
  UploadFileEndpointParams,
} from '../public-types';
import {
  ITestVars,
  addRootnameToPath,
  filepathListToString,
  makeTestFilepath,
} from './utils';
import assert = require('assert');
import path = require('path');

export async function deleteFileTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteFileEndpointParams> = {}
) {
  let filepath = props.filepath;
  if (!filepath) {
    const file = await uploadFileTest(endpoint, vars);
    filepath = addRootnameToPath(
      filepathListToString(file.body.file.namePath, file.body.file.extension),
      vars.workspaceRootname
    );
  }

  assert.ok(filepath);
  const input: DeleteFileEndpointParams = {
    filepath,
  };

  const result = await endpoint.files.deleteFile({body: input});
}

export async function getFileDetailsTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetFileDetailsEndpointParams> = {}
) {
  let filepath = props.filepath;
  if (!filepath) {
    const file = await uploadFileTest(endpoint, vars);
    filepath = addRootnameToPath(
      filepathListToString(file.body.file.namePath, file.body.file.extension),
      vars.workspaceRootname
    );
  }

  assert.ok(filepath);
  const input: GetFileDetailsEndpointParams = {
    filepath,
  };

  const result = await endpoint.files.getFileDetails({body: input});
  return result;
}

export async function updateFileDetailsTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateFileDetailsEndpointParams> = {}
) {
  let filepath = props.filepath;
  if (!filepath) {
    const file = await uploadFileTest(endpoint, vars);
    filepath = addRootnameToPath(
      filepathListToString(file.body.file.namePath, file.body.file.extension),
      vars.workspaceRootname
    );
  }

  assert.ok(filepath);
  const input: UpdateFileDetailsEndpointParams = {
    filepath,
    file: {
      description: faker.lorem.sentence(),
      mimetype: faker.system.mimeType(),
    },
  };

  const result = await endpoint.files.updateFileDetails({body: input});
  return result;
}

export async function getFileTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<ReadFileEndpointParams> = {}
) {
  let filepath = props.filepath;
  if (!filepath) {
    const file = await uploadFileTest(endpoint, vars);
    filepath = addRootnameToPath(
      filepathListToString(file.body.file.namePath, file.body.file.extension),
      vars.workspaceRootname
    );
  }

  assert.ok(filepath);
  const input: ReadFileEndpointParams = {
    filepath,
  };

  const result = await endpoint.files.readFile({body: input});
  return result;
}

export async function uploadFileTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UploadFileEndpointParams> = {}
) {
  const incomingFilepath = path.normalize(process.cwd() + vars.testFilepath);
  const genInput: UploadFileEndpointParams = {
    // data: blobFromSync(filepath).stream(),
    data: createReadStream(incomingFilepath),
    description: faker.lorem.sentence(),
    encoding: 'base64',
    // extension: faker.system.fileExt(),
    filepath: makeTestFilepath(vars.workspaceRootname, faker.system.filePath()),
    mimetype: faker.system.mimeType(),
  };

  const input = merge(genInput, props);
  const result = await endpoint.files.uploadFile({body: input});
  return result;
}

export async function deleteManyFilesByPath(
  endpoint: FimidaraEndpoints,
  filepaths: string[]
) {
  await Promise.allSettled(
    filepaths.map(filepath => endpoint.files.deleteFile({body: {filepath}}))
  );
}

export async function deleteManyFilesById(
  endpoint: FimidaraEndpoints,
  ids: string[]
) {
  await Promise.allSettled(
    ids.map(fileId => endpoint.files.deleteFile({body: {fileId}}))
  );
}
