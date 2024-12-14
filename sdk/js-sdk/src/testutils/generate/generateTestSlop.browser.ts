import {faker} from '@faker-js/faker';
import {server} from '@vitest/browser/context';

export interface IGenerateTestSlopParams {
  minSize?: number;
  filepath: string;
}

export async function generateTestSlop(params: IGenerateTestSlopParams) {
  let generatedSize = 0;
  const minSize = params?.minSize ?? 5 * 1024; // defaults to 5kb
  let p: Promise<void> | undefined;

  while (generatedSize < minSize) {
    const text = faker.lorem.paragraphs(500);
    const newData = new Blob([text], {type: 'text/plain'});
    generatedSize += newData.size;
    await p;
    p = server.commands.writeFile(params.filepath, text, {
      encoding: 'utf-8',
      flag: 'a', // append and create if not exists
    });
  }

  await p;
}

export async function hasTestSlop(params: {filepath: string; size: number}) {
  try {
    const text = await server.commands.readFile(params.filepath);
    const size = new Blob([text]).size;
    return size >= params.size;
  } catch (e) {
    return false;
  }
}
