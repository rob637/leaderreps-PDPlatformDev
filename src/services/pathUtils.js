export const buildUserProfilePath = (uid) => `users/${uid}`;

export const buildModulePath = (userId, moduleName, docName) => {
  return `modules/${userId}/${moduleName}/${docName}`;
};