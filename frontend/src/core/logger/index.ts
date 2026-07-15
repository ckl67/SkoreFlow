// To import the logger:
//    import { logger } from "@/core/logger/logger";
// To import the levels:
//    import { LogLevel } from "@/core/logger/levels";
//  We need to know the exact name of each file.
//
// With index.ts
//  We can write
//  import { logger, LogLevel } from "@/core/logger";
//  --> We do not longer need to know about the internal files.
//    It is the folder that decides what it exposes.

export * from './logger';
export * from './levels';
