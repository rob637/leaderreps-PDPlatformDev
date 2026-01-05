// src/services/metadataResolver.js
import { MOCK_GLOBAL_METADATA } from './mockData';

export const resolveGlobalMetadata = (
  globalMetadata,
  useMock,
  // user,
  // userDoc
) => {
  if (useMock) {
    return MOCK_GLOBAL_METADATA;
  }
  if (globalMetadata) {
    return globalMetadata;
  }
  // Removed forced mock for admins to allow testing of live CMS data
  /*
  if (user && userDoc) {
    const roles = userDoc.roles || [];
    if (roles.includes('admin')) {
      return MOCK_GLOBAL_METADATA;
    }
  }
  */
  return null;
};
