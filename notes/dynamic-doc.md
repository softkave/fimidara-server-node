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
