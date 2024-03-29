# fimidara JS SDK

JS SDK for [fimidara](https://www.fimidara.com), a file storage service. [Click here for docs](https://www.fimidara.com/docs/fimidara-js-sdk).

## Installation

`npm install fimidara` or `yarn add fimidara`

## Usage

```typescript
// import fimidara
import * as fimidara from 'fimidara';

// setup
const fimidaraEndpoints = new fimidara.FimidaraEndpoints({
  authToken: '<your auth token>',
});

// perform operations
const file = fimidara.file.readFile({
  body: {
    filepath: 'workspace-rootname/folder/path/to/file.png',
    imageTransformation: {
      width: 100, // 100px
      height: 100, // 100px
    },
  },
});

// change auth token
fimidara.setConfig({authToken: '<new auth token>'});

// display file
<img
  src={fimidara.getFimidaraReadFileURL({
    filepath: 'workspace-rootname/folder/path/to/file.png',
    width: 100, // 100px
    height: 100, // 100px
  })}
/>;

// get upload file URL for form uploads
const uploadFileURL = fimidara.getUploadFileURL({
  filepath: 'workspace-rootname/folder/path/to/file.png',
});
```
