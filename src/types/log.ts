export type LogLevel = 'Information' | 'Warning' | 'Error' | 'Fatal' | 'Debug' | 'Verbose' | 'Trace' | 'Other';

export interface LogFileInfo {
  fileName: string;
  length: number;
  creationTime: string;
  lastWriteTime: string;
}

export interface LogFileDetail {
  name: string;
  content: string;
  creationTime: string;
  lastWriteTime: string;
}

export interface StackTraceFrame {
  id: number;
  raw: string;
  method: string;
  filePath?: string;
  fileName?: string;
  lineNumber?: number;
  isAppCode: boolean;
}

export interface ParsedException {
  type: string;
  shortType: string;
  message: string;
  methodName?: string;
  user?: string;
  fullName?: string;
  rawStackTrace: string;
  frames: StackTraceFrame[];
}

export interface ParsedLogLine {
  id: number;
  raw: string;
  timestamp?: string;
  level: LogLevel;
  message: string;
  isContinuation?: boolean;
  exception?: ParsedException;
}
