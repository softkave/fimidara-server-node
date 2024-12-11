import {faker} from '@faker-js/faker';
import fse from 'fs-extra';

export interface IGenerateTestSlopParams {
  minSize?: number;
  filepath: string;
}

export async function generateTestSlop(params: IGenerateTestSlopParams) {
  let generatedSize = 0;
  const minSize = params?.minSize || 1000;
  let p: Promise<void> | undefined;

  while (generatedSize < minSize) {
    const newData = Buffer.from(faker.lorem.paragraphs(500));
    generatedSize += newData.length;
    await p;
    p = fse.appendFile(params.filepath, newData);
  }

  return p;
}

export async function hasTestSlop(params: {filepath: string; size: number}) {
  try {
    const stats = await fse.stat(params.filepath);
    return stats.size < params.size;
  } catch (e) {
    return false;
  }
}
