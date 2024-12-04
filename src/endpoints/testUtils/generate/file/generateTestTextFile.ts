import {faker} from '@faker-js/faker';
import {Readable} from 'stream';

export interface IGenerateTestTextFileParams {
  minSize?: number;
}

export function generateTestTextFile(params?: IGenerateTestTextFileParams) {
  let dataBuffer = Buffer.alloc(0);
  const minSize = params?.minSize || 1000;
  while (dataBuffer.length < minSize) {
    dataBuffer = Buffer.concat([
      dataBuffer,
      Buffer.from(faker.lorem.paragraphs(10)),
    ]);
  }

  return {dataBuffer, getStream: () => Readable.from([dataBuffer])};
}
