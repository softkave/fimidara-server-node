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

export function getTagsPublicHttpEndpoints() {
  const tagsExportedEndpoints: TagsExportedEndpoints = {
    addTag: {
      fn: addTag,
      mddocHttpDefinition: addTagEndpointDefinition,
    },
    deleteTag: {
      fn: deleteTag,
      mddocHttpDefinition: deleteTagEndpointDefinition,
    },
    getTag: {
      fn: getTag,
      mddocHttpDefinition: getTagEndpointDefinition,
    },
    getWorkspaceTags: {
      fn: getWorkspaceTags,
      mddocHttpDefinition: getWorkspaceTagsEndpointDefinition,
    },
    countWorkspaceTags: {
      fn: countWorkspaceTags,
      mddocHttpDefinition: countWorkspaceTagsEndpointDefinition,
    },
    updateTag: {
      fn: updateTag,
      mddocHttpDefinition: updateTagEndpointDefinition,
    },
  };
  return tagsExportedEndpoints;
}
