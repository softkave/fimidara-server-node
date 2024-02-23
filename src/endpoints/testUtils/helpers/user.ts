import {kUtilsInjectables} from '../../contexts/injection/injectables';

export async function assertUserTokenIsSame(str01: string, str02: string) {
  const t01 = kUtilsInjectables.session().decodeToken(str01);
  const t02 = kUtilsInjectables.session().decodeToken(str02);
  expect(t01.sub.id).toEqual(t02.sub.id);
}
