// src/services/metadataResolver.js
import { MOCK_GLOBAL_METADATA } from './mockData';

export const resolveGlobalMetadata = (
  globalMetadata,
  useMock,
  user,
  userDoc
) => {
  if (useMock) {
    return MOCK_GLOBAL_METADATA;
  }
  if (globalMetadata) {
    return globalMetadata;
  }
  if (user && userDoc) {
    const roles = userDoc.roles || [];
    if (roles.includes('admin')) {
      return MOCK_GLOBAL_METADATA;
    }
  }
  return null;
};
