import {faker} from '@faker-js/faker';
import {ensureDir, ensureFile} from 'fs-extra';
import {readFile, writeFile} from 'fs/promises';
import path from 'path-browserify';
import {indexArray, loopAndCollate} from 'softkave-js-utils';
import {expect} from 'vitest';
import {File as FimidaraFile} from '../../endpoints/publicTypes.js';
import {getNodeDirContent} from '../../node/getNodeDirContent.js';
import {stringifyFimidaraFilename} from '../../path/file.js';
import {uploadFileTestExecFn} from '../execFns/file.js';
import {fimidaraTestInstance, fimidaraTestVars} from '../tests/file.js';
import {streamToString} from '../utils.node.js';

export async function genLocalFiles(localpath: string, count: number) {
  const text = 'Hello World!';
  const filenames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    count
  );
  await Promise.all(
    filenames.map(async fName => {
      const fp = path.join(localpath, fName);
      await ensureFile(fp);
      await writeFile(fp, text, 'utf-8');
    })
  );

  return {text, filenames};
}

export async function genLocalFolders(localpath: string) {
  const foldernames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    /** count */ 1
  );
  await Promise.all(
    foldernames.map(async fName => {
      const fp = path.join(localpath, fName);
      await ensureDir(fp);
    })
  );

  return {foldernames};
}

export async function genFimidaraFiles(fimidarapath: string, count: number) {
  const text = 'Hello World!';
  const buf = Buffer.from(text);
  const filenames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    count
  );

  await Promise.all(
    filenames.map(async fName => {
      const fp = path.posix.join(fimidarapath, fName);

      await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars, {
        filepath: fp,
        data: text,
        size: buf.byteLength,
      });
    })
  );

  return {text, filenames};
}

export async function genFimidaraFolders(fimidarapath: string, count = 1) {
  const foldernames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    // () => randomUUID(),
    count
  );
  await Promise.all(
    foldernames.map(async fName => {
      const fp = path.posix.join(fimidarapath, fName);
      await fimidaraTestInstance.folders.addFolder({
        folderpath: fp,
      });
    })
  );

  return {foldernames};
}

export async function assertLocalFilesAndFolders(
  localpath: string,
  filenames: string[] | undefined,
  foldernames: string[] | undefined
) {
  const {fileStatsRecord, folderStatsRecord, externalFilesRecord} =
    await getNodeDirContent({
      folderpath: localpath,
    });
  const localFilenameList = Object.keys(fileStatsRecord);
  const localFoldernameList = Object.keys(folderStatsRecord);

  if (filenames) {
    expect(localFilenameList).toEqual(expect.arrayContaining(filenames));
  }

  if (foldernames) {
    expect(localFoldernameList).toEqual(expect.arrayContaining(foldernames));
  }

  return {
    fileStatsRecord,
    folderStatsRecord,
    localFilenameList,
    localFoldernameList,
    externalFilesRecord,
  };
}

export async function assertFimidaraFolderContent(
  fimidarapath: string,
  filenames: string[] | undefined,
  foldernames: string[] | undefined,
  beforeCopyDate: number | undefined
) {
  const {files, folders} = await fimidaraTestInstance.folders.listFolderContent(
    {
      folderpath: fimidarapath,
    }
  );

  const fimidaraFilenamesMap = indexArray(files, {
    indexer: stringifyFimidaraFilename,
  });
  const fimidaraFoldernamesMap = indexArray(folders, {
    indexer: f => f.name,
  });
  const fimidaraFilenamesList = Object.keys(fimidaraFilenamesMap);
  const fimidaraFoldernamesList = Object.keys(fimidaraFoldernamesMap);

  if (filenames) {
    expect(fimidaraFilenamesList).toEqual(expect.arrayContaining(filenames));
  }

  if (foldernames) {
    expect(foldernames).toEqual(
      expect.arrayContaining(fimidaraFoldernamesList)
    );
  }

  if (beforeCopyDate) {
    files.forEach(f => {
      expect(f.lastUpdatedAt).toBeLessThanOrEqual(beforeCopyDate);
    });
  }

  return {
    files,
    folders,
    fimidaraFilenamesMap,
    fimidaraFoldernamesMap,
    fimidaraFilenamesList,
    fimidaraFoldernamesList,
  };
}

export async function assertFimidaraFilesContent(
  files: FimidaraFile[],
  text: string
) {
  const fStrList = await Promise.all(
    files.map(async f => {
      const body = await fimidaraTestInstance.files.readFile(
        {fileId: f.resourceId},
        {responseType: 'stream'}
      );
      return await streamToString(body);
    })
  );

  fStrList.forEach((str, i) =>
    expect(str, `${files[i].name} data is incorrect`).toBe(text)
  );
}

export async function assertLocalFilesContent(
  localpath: string,
  files: FimidaraFile[],
  text: string
) {
  const fStrList = await Promise.all(
    files.map(async f =>
      readFile(path.join(localpath, stringifyFimidaraFilename(f)), 'utf-8')
    )
  );

  fStrList.forEach((str, i) =>
    expect(str, `${files[i].name} data is incorrect`).toBe(text)
  );
}
