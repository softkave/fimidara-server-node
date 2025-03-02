import {expect} from 'vitest';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';

export async function assertUserTokenIsSame(str01: string, str02: string) {
  const t01 = kIjxUtils.session().decodeToken(str01);
  const t02 = kIjxUtils.session().decodeToken(str02);
  expect(t01.sub.id).toEqual(t02.sub.id);
}
