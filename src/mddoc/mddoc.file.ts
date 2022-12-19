import * as fs from 'fs';
import {
  docEndpoint,
  FieldNull,
  FieldObject,
  FieldOrCombination,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointQuery,
  HttpEndpointQueryItem,
} from './mddoc';

function main() {
  const filepath =
    './mdoc/' + new Date().toDateString() + new Date().valueOf() + '.md';
  const endpoint = new HttpEndpointDefinition(
    '/account/signupUser',
    HttpEndpointMethod.Post,
    undefined,
    new HttpEndpointQuery([
      new HttpEndpointQueryItem('app', new FieldString(true)),
    ]),
    new FieldObject('UserLoginResult', {
      token: new FieldString(true),
      user: new FieldObject('User', {
        firstName: new FieldString(),
        email: new FieldString(),
        lastName: new FieldString(),
      }),
    }),
    undefined,
    new FieldObject('UserLoginResult', {
      token: new FieldString(true),
      user: new FieldObject('User', {
        firstName: new FieldString(),
        email: new FieldString(),
        lastName: new FieldString(),
      }),
      orField: new FieldOrCombination([
        new FieldNull(),
        new FieldString(),
        new FieldObject('AnotherOne', {
          firstName: new FieldString(),
          email: new FieldString(),
        }),
      ]),
    }),
    undefined
  );

  const md = docEndpoint(endpoint);

  fs.writeFileSync(filepath, md);
}

main();
