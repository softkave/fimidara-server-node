import {kEndpointTag} from '../types.js';
import addTag from './addTag/handler.js';
import countWorkspaceTags from './countWorkspaceTags/handler.js';
import deleteTag from './deleteTag/handler.js';
import {
  addTagEndpointDefinition,
  countWorkspaceTagsEndpointDefinition,
  deleteTagEndpointDefinition,
  getTagEndpointDefinition,
  getWorkspaceTagsEndpointDefinition,
  updateTagEndpointDefinition,
} from './endpoints.mddoc.js';
import getTag from './getTag/handler.js';
import getWorkspaceTags from './getWorkspaceTags/handler.js';
import {TagsExportedEndpoints} from './types.js';
import updateTag from './updateTag/handler.js';

export function getTagsHttpEndpoints() {
  const tagsExportedEndpoints: TagsExportedEndpoints = {
    addTag: {
      tag: [kEndpointTag.public],
      fn: addTag,
      mddocHttpDefinition: addTagEndpointDefinition,
    },
    deleteTag: {
      tag: [kEndpointTag.public],
      fn: deleteTag,
      mddocHttpDefinition: deleteTagEndpointDefinition,
    },
    getTag: {
      tag: [kEndpointTag.public],
      fn: getTag,
      mddocHttpDefinition: getTagEndpointDefinition,
    },
    getWorkspaceTags: {
      tag: [kEndpointTag.public],
      fn: getWorkspaceTags,
      mddocHttpDefinition: getWorkspaceTagsEndpointDefinition,
    },
    countWorkspaceTags: {
      tag: [kEndpointTag.public],
      fn: countWorkspaceTags,
      mddocHttpDefinition: countWorkspaceTagsEndpointDefinition,
    },
    updateTag: {
      tag: [kEndpointTag.public],
      fn: updateTag,
      mddocHttpDefinition: updateTagEndpointDefinition,
    },
  };
  return tagsExportedEndpoints;
}
