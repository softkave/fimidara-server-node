import {faker} from '@faker-js/faker';
import {getRandomIntInclusive} from '../../../utils/fns';

export function generateTestFolderName() {
  return getRandomIntInclusive(1, 2) % 2 === 0
    ? faker.system.commonFileName()
    : faker.lorem.words();
}
