# Dynamic Documentation

## Goal

- Document endpoints
  - Method
  - Request
    - Body
    - Query
    - Pathname
    - Headers
  - Response
    - Type
    - Body
- Document types to be used in endpoints
  - Fields for types with fields
    - Field children for fields that are arrays or objects
  - Type
  - Description
  - Example

## Implementation Options

- Typescript static analysis and extraction using Typescript API
- Runtime extraction

## Documenting Endpoints

Using runtime extraction, we'll have a class that represent endpoints with the following properties.

```typescript
enum HttpEndpointMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete',
}

class HttpEndpointMethodDefinition {
  method: HttpEndpointMethod;
  query: any;
}

class EndpointDefinition {
  pathname: string;
}
```

`identifier` {`string`} [`required`] - This is a required string field.

`identifier` | `string` | `required` - This is a required string field.

- `identifier`
  - **Type** — `string` | `number`
  - **Required** — `true`
  - **Description** — Identifier description so that you can know what the identifier is about. Specifies what content encodings have been applied to the object and thus what decoding mechanisms must be applied to obtain the media-type referenced by the Content-Type header field.
  - **Fields**
    - `identifier`<br />**Type** — `string` | `number`<br />
      **Required** — `true`<br />
      **Description** — Identifier description so that you can know what the identifier is about. Specifies what content encodings have been applied to the object and thus what decoding mechanisms must be applied to obtain the media-type referenced by the Content-Type header field.
      ```jsonc
      {
        "identifier": 0 // required
      }
      ```
- `identifier` — `string` | `number` — required
  - **Type** — `string` | `number`
  - **Required** — `true`
  - **Description** — Identifier description so that you can know what the identifier is about. Specifies what content encodings have been applied to the object and thus what decoding mechanisms must be applied to obtain the media-type referenced by the Content-Type header field.
