import {OptionalKeysOf} from 'type-fest';
import {AccessorConstruct, ClassFieldsWithAccessorsMixin} from '../utils/classAccessors';
import {AnyObject} from '../utils/types';

// TODO: remove setRequired from others
// TODO: HTTP header should be an object, same for path parameters
// TODO: solve the issue with required or not for query and body
// TODO: either return shorted enums to descriptive text or find a way to add comments to them in api and sdk.
// TODO: stripSpaceFromNewline, padNewline, replaceLayoutPlaceholders
// TODO: http endpoint result
// TODO: count endpoints
// TODO: clarify in docs, endpoints that have required body but same fields can be passed in path or query
// TODO: mddoc path parameters show, add error response, change some wordings, allow linking to href of types, show json rep of type

export class FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldBase());
  }

  __id = FieldBase.name;
  stringType = 'any';
  constructor(public required?: boolean, public description?: string) {}
}

export class FieldString extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldString());
  }

  __id = FieldString.name;
  stringType = 'string';
  constructor(
    required?: boolean,
    description?: string,
    public example?: string,
    public valid?: string[],
    public min?: number,
    public max?: number,
    public enumName?: string
  ) {
    super(required, description);
  }
}
export class FieldNumber extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldNumber());
  }

  __id = FieldNumber.name;
  stringType = 'number';
  constructor(
    required?: boolean,
    description?: string,
    public example?: number,
    public integer?: boolean,
    public min?: number,
    public max?: number
  ) {
    super(required, description);
  }
}

export class FieldBoolean extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldBoolean());
  }

  __id = FieldBoolean.name;
  stringType = 'boolean';
  constructor(required?: boolean, description?: string, public example?: boolean) {
    super(required, description);
  }
}

export class FieldNull extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldNull());
  }

  __id = FieldNull.name;
  stringType = 'null';
}

export class FieldUndefined extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldUndefined());
  }

  __id = FieldUndefined.name;
  stringType = 'undefined';
}

export class FieldDate extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldDate());
  }

  __id = FieldDate.name;
  stringType = 'number';
  constructor(required?: boolean, description?: string, public example?: string) {
    super(required, description);
  }
}

export class FieldArray<T> extends FieldBase {
  static construct<T>() {
    return AccessorConstruct.wrap(new FieldArray<T>());
  }

  __id = FieldArray.name;
  constructor(
    required?: boolean,
    description?: string,
    public type?: ConvertToMddocType<T>,
    public min?: number,
    public max?: number
  ) {
    super(required, description);
    this.stringType = `array of (${type ? type.stringType : 'unknown'})`;
  }

  setType(type?: ConvertToMddocType<T>) {
    this.type = type;
    if (type) this.stringType = `array of (${type.stringType})`;
    return this;
  }
}

export class FieldObjectFieldRequired<T> {
  private optional = true;
  constructor(public data: T) {}
}
export class FieldObjectFieldOptional<T> {
  private required = true;
  constructor(public data: T) {}
}

export type ConvertToMddocType<T> = T extends string
  ? MddocTypeFieldString
  : T extends number
  ? MddocTypeFieldNumber
  : T extends boolean
  ? MddocTypeFieldBoolean
  : T extends Array<infer InferedType>
  ? MddocTypeFieldArray<InferedType>
  : T extends Buffer
  ? MddocTypeFieldBinary
  : T extends AnyObject
  ? MddocTypeFieldObject<T>
  : MddocTypeFieldBase;

export type FieldObjectFields<T extends object> = Required<{
  [K in keyof T]: K extends OptionalKeysOf<T>
    ? FieldObjectFieldOptional<ConvertToMddocType<T[K]>>
    : FieldObjectFieldRequired<ConvertToMddocType<T[K]>>;
}>;

// API type changes in line with definitions
export class FieldObject<T extends object = any> extends FieldBase {
  static construct<TConstructFields extends object = any>(): ClassFieldsWithAccessorsMixin<
    FieldObject<TConstructFields>
  > {
    return AccessorConstruct.wrap(
      FieldObject.construct<TConstructFields>()
    ) as ClassFieldsWithAccessorsMixin<FieldObject<TConstructFields>>;
  }

  static optionalField<T1 extends MddocTypeFieldBase>(data: T1) {
    data = (data.getRequired() ? data.clone().setRequired(false) : data) as T1;
    return new FieldObjectFieldOptional<T1>(data);
  }

  static requiredField<T1 extends MddocTypeFieldBase>(data: T1) {
    data = (data.getRequired() === false ? data.clone().setRequired(true) : data) as T1;
    return new FieldObjectFieldRequired<T1>(data);
  }

  __id = FieldObject.name;
  stringType = 'object';
  constructor(
    required?: boolean,
    description?: string,
    public name?: string | undefined,
    public fields?: FieldObjectFields<T>
  ) {
    super(required, description);
    this.stringType = name ?? this.stringType;
  }
}

export class FieldOrCombination extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldOrCombination());
  }

  __id = FieldOrCombination.name;
  constructor(required?: boolean, description?: string, public types?: Array<MddocTypeFieldBase>) {
    super(required, description);
    this.stringType = (types ?? []).map(f => f.stringType).join(' or ');
  }

  setTypes(types?: Array<MddocTypeFieldBase>) {
    this.types = types;
    if (types) this.stringType = types.map(f => f.stringType).join(' or ');
    return this;
  }
}

export class FieldBinary extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldBinary());
  }

  __id = FieldBinary.name;
  stringType = 'binary';
}

export enum HttpEndpointMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete',
}

export class HttpEndpointMultipartFormdata<T extends object> {
  static construct<Body extends object = AnyObject>() {
    return AccessorConstruct.wrap(new HttpEndpointMultipartFormdata<Body>());
  }

  __id = HttpEndpointMultipartFormdata.name;
  constructor(public items?: MddocTypeFieldObject<T>) {}
}

export class HttpEndpointHeaderItem {
  static construct() {
    return AccessorConstruct.wrap(new HttpEndpointHeaderItem());
  }

  __id = HttpEndpointHeaderItem.name;
  constructor(
    public name?: string,
    public type?: MddocTypeFieldString | MddocTypeFieldNumber,
    public required?: boolean,
    public description?: string
  ) {}
}

export type HttpEndpointDefinitionGenericsStructure = {
  pathParameters?: any;
  requestHeaders?: any;
  query?: any;
  requestBody?: any;
  responseHeaders?: any;
  responseBody?: any;
};

export type InferHttpEndpointTTypes<T extends HttpEndpointDefinition<any>> =
  T extends HttpEndpointDefinition<infer TTypes> ? TTypes : never;

export class HttpEndpointDefinition<TTypes extends HttpEndpointDefinitionGenericsStructure> {
  static construct<TTypes extends HttpEndpointDefinitionGenericsStructure>() {
    return AccessorConstruct.wrap(new HttpEndpointDefinition<TTypes>());
  }

  __id = HttpEndpointDefinition.name;
  constructor(
    public basePathname?: string,
    public method?: HttpEndpointMethod,
    public pathParamaters?: MddocTypeFieldObject<TTypes['pathParameters']>,
    public query?: MddocTypeFieldObject<TTypes['query']>,
    public requestBody?:
      | MddocTypeFieldObject<TTypes['requestBody']>
      | MddocTypeHttpEndpointMultipartFormdata<TTypes['requestBody']>,
    public requestHeaders?: MddocTypeFieldObject<TTypes['requestHeaders']>,
    public responseHeaders?: MddocTypeFieldObject<TTypes['responseHeaders']>,
    public responseBody?: TTypes['responseBody'] extends FieldBinary
      ? MddocTypeFieldBinary
      : MddocTypeFieldObject<TTypes['responseBody']>,
    public name?: string,
    public description?: string
  ) {}
}

export type MddocTypeFieldBase = ClassFieldsWithAccessorsMixin<FieldBase>;
export type MddocTypeFieldString = ClassFieldsWithAccessorsMixin<FieldString>;
export type MddocTypeFieldNumber = ClassFieldsWithAccessorsMixin<FieldNumber>;
export type MddocTypeFieldBoolean = ClassFieldsWithAccessorsMixin<FieldBoolean>;
export type MddocTypeFieldNull = ClassFieldsWithAccessorsMixin<FieldNull>;
export type MddocTypeFieldUndefined = ClassFieldsWithAccessorsMixin<FieldUndefined>;
export type MddocTypeFieldDate = ClassFieldsWithAccessorsMixin<FieldDate>;
export type MddocTypeFieldArray<T> = ClassFieldsWithAccessorsMixin<FieldArray<T>>;
export type MddocTypeFieldObject<TObject extends object = any> = ClassFieldsWithAccessorsMixin<
  FieldObject<TObject>
>;
export type MddocTypeFieldOrCombination = ClassFieldsWithAccessorsMixin<FieldOrCombination>;
export type MddocTypeFieldBinary = ClassFieldsWithAccessorsMixin<FieldBinary>;
export type MddocTypeHttpEndpoint<TTypes extends HttpEndpointDefinitionGenericsStructure> =
  ClassFieldsWithAccessorsMixin<HttpEndpointDefinition<TTypes>>;
export type MddocTypeHttpEndpointMultipartFormdata<T extends object> =
  ClassFieldsWithAccessorsMixin<HttpEndpointMultipartFormdata<T>>;

export function isLiteralField(
  f: MddocTypeFieldBase
): f is
  | MddocTypeFieldBinary
  | MddocTypeFieldNumber
  | MddocTypeFieldString
  | MddocTypeFieldBoolean
  | MddocTypeFieldUndefined
  | MddocTypeFieldNull {
  return (
    f &&
    (f.__id === FieldBinary.name ||
      f.__id === FieldNumber.name ||
      f.__id === FieldString.name ||
      f.__id === FieldBoolean.name ||
      f.__id === FieldUndefined.name ||
      f.__id === FieldNull.name)
  );
}

export function isMddocFieldObject(f: any): f is MddocTypeFieldObject {
  return f && f.__id == FieldObject.name;
}

export function isMddocFieldArray(f: any): f is MddocTypeFieldArray<any> {
  return f && f.__id === FieldArray.name;
}

export function isMddocMultipartFormdata(f: any): f is MddocTypeHttpEndpointMultipartFormdata<any> {
  return f && f.__id === HttpEndpointMultipartFormdata;
}

export function isMddocFieldBinary(f: any): f is MddocTypeFieldBinary {
  return f && f.__id === FieldBinary.name;
}

export function objectHasRequiredFields(item: MddocTypeFieldObject) {
  return item.getFields()
    ? Object.values(item.assertGetFields()).findIndex(next => next.data.getRequired()) !== -1
    : false;
}
