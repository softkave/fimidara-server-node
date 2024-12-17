import {faker} from '@faker-js/faker';
import {server} from '@vitest/browser/context';
import path from 'path-browserify';
import {beforeAll, describe, expect, test} from 'vitest';
import {
  fimidaraAddRootnameToPath,
  FimidaraEndpoints,
} from '../../indexBrowser.js';
import {
  generateTestSlop,
  hasTestSlop,
} from '../../testutils/generate/generateTestSlop.browser.js';
import {getTestVars} from '../../testutils/utils.common.js';
import {multipartUploadBrowser} from '../multipartBrowser.js';

const testVars = getTestVars();
const fimidara = new FimidaraEndpoints({
  authToken: testVars.authToken,
  serverURL: testVars.serverURL,
});

let slopString: string | undefined;
let slopBlob: Blob | undefined;

const kMinSlopSize = 9 * 1024 * 1024; // 9MB
const slopFilepath = path.normalize(
  testVars.cwd +
    testVars.testFolderPath +
    `/slop/browser-multipart-slop-${kMinSlopSize}.txt`
);

beforeAll(async () => {
  if (!(await hasTestSlop({filepath: slopFilepath, size: kMinSlopSize}))) {
    await generateTestSlop({filepath: slopFilepath, minSize: kMinSlopSize});
  }

  slopString = await server.commands.readFile(slopFilepath);
  slopBlob = new Blob([slopString]);
});

async function expectReadEqualsSlop(fileId: string) {
  const readResult = await fimidara.files.readFile(
    {fileId},
    {responseType: 'blob'}
  );

  const savedString = await readResult.text();

  expect(savedString).toEqual(slopString);
}

describe.each([
  {
    data: 'blob',
    getData: () => ({
      data: slopBlob!,
      size: slopBlob!.size,
    }),
  },
  {
    data: 'string',
    getData: () => ({
      data: slopString!,
      size: slopBlob!.size,
    }),
  },
])('multipartUploadBrowser, $data ', ({data, getData}) => {
  test(
    'upload',
    async () => {
      const {data, size} = getData();

      const description = faker.lorem.sentence();
      const encoding = 'base64';
      const filepath = fimidaraAddRootnameToPath(
        faker.system.filePath(),
        testVars.workspaceRootname
      );
      const mimetype = faker.system.mimeType();
      const result = await multipartUploadBrowser({
        data,
        size,
        description,
        encoding,
        filepath,
        mimetype,
        clientMultipartId: 'test-' + faker.string.uuid(),
        endpoints: fimidara,
      });

      expect(result.file.description).toEqual(description);
      expect(result.file.encoding).toEqual(encoding);
      expect(result.file.mimetype).toEqual(mimetype);
      expect(result.file.size).toEqual(size);

      await expectReadEqualsSlop(result.file.resourceId);
    },
    1000 * 60 * 5 // 5 minutes
  );
});
