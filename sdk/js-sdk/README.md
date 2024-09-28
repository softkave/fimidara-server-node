# fimidara

JavaScript SDK for [fimidara.com](https://www.fimidara.com), a file storage service. See docs at [https://www.fimidara.com/docs/fimidara-js-sdk](https://www.fimidara.com/docs/fimidara-js-sdk).

## Installation

- `npm install fimidara`
- `yarn add fimidara`

## Usage

```typescript
// import fimidara
import * as fimidara from 'fimidara';

// setup
const fimidaraEndpoints = new fimidara.FimidaraEndpoints({
  authToken: '<your auth token>',
});

// change auth token
fimidara.setConfig({authToken: '<new auth token>'});

// perform operations
const file = fimidara.file.readFile({
  filepath: 'workspace-rootname/folder/path/to/file.png',
});

// display file
<img
  src={fimidara.getFimidaraReadFileURL({
    filepath: 'workspace-rootname/folder/path/to/file.png',
  })}
/>;

// get upload file URL for form uploads
const uploadFileURL = fimidara.getFimidaraUploadFileURL({
  filepath: 'workspace-rootname/folder/path/to/file.png',
});
```
