import {test_addAgentToken} from '../../src/testutils/tests/agentToken';
import {
  test_deleteFile,
  test_getFileDetails,
  test_readFile_blob,
  test_updateFileDetails,
} from '../../src/testutils/tests/file';
import UploadFileTest from './testComponents/UploadFileTest';
import {ISubmittedTestItem} from './types';

export const fimidaraJsSdkUITests: ISubmittedTestItem[] = [
  {
    name: test_addAgentToken.name,
    type: 'auto',
    fn: test_addAgentToken,
  },

  // file
  {
    name: test_readFile_blob.name,
    type: 'auto',
    fn: test_readFile_blob,
  },
  {
    name: test_updateFileDetails.name,
    type: 'auto',
    fn: test_updateFileDetails,
  },
  {
    name: test_getFileDetails.name,
    type: 'auto',
    fn: test_getFileDetails,
  },
  {
    name: test_deleteFile.name,
    type: 'auto',
    fn: test_deleteFile,
  },
  {
    name: 'upload file test',
    type: 'manual',
    fn: (test, controller) => (
      <UploadFileTest controller={controller} test={test} />
    ),
  },
];
