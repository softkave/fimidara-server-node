import {expect} from 'vitest';
import {kIkxUtils} from '../../../contexts/ijx/injectables.js';

export async function assertUserTokenIsSame(str01: string, str02: string) {
  const t01 = kIkxUtils.session().decodeToken(str01);
  const t02 = kIkxUtils.session().decodeToken(str02);
  expect(t01.sub.id).toEqual(t02.sub.id);
}
