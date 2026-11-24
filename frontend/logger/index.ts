// To import the logger :
// import { logger } from '../../logger';
// --------------------------------------------------
// To get and set the Level of the log
//  const moduleName = 'api';
//  const previousLevel = logger.getModuleLevel(moduleName);
//  logger.setModuleLevel(moduleName, 'debug');
// --------------------------------------------------
// To Log
// logger.debug('avatar', 'Before rendering', userId);

export * from './logger';
export * from './levels';
