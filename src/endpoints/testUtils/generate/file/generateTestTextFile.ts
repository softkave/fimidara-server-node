import {faker} from '@faker-js/faker';
import {Readable} from 'stream';

export function generateTestTextFile() {
  const text = faker.lorem.paragraphs(10);
  const dataBuffer = Buffer.from(text);

  return {dataBuffer, getStream: () => Readable.from([dataBuffer])};
}
