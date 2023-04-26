import {BaseContextType} from '../../contexts/types';

export async function assertUserTokenIsSame(
  context: BaseContextType,
  str01: string,
  str02: string
) {
  const t01 = context.session.decodeToken(context, str01);
  const t02 = context.session.decodeToken(context, str02);
  expect(t01.sub.id).toEqual(t02.sub.id);
}
