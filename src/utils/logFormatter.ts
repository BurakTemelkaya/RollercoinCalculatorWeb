import { LogLevel, ParsedLogLine, ParsedException, StackTraceFrame } from '../types/log';

/**
 * Formats bytes into human-readable file size (B, KB, MB, GB).
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(k, safeI);

  return `${safeI === 0 ? size : size.toFixed(size < 10 ? 2 : 1)} ${units[safeI]}`;
}

/**
 * Formats an ISO or C# date string into user-friendly localized string.
 */
export function formatLogDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Maps any log level string to a standardized LogLevel.
 */
export function normalizeLogLevel(levelStr: string): LogLevel {
  const upper = levelStr.toUpperCase();
  if (upper.includes('INF')) return 'Information';
  if (upper.includes('WARN')) return 'Warning';
  if (upper.includes('ERR')) return 'Error';
  if (upper.includes('FATAL')) return 'Fatal';
  if (upper.includes('DBG') || upper.includes('DEBUG')) return 'Debug';
  if (upper.includes('VERB')) return 'Verbose';
  if (upper.includes('TRACE')) return 'Trace';
  return 'Other';
}

/**
 * Regex matching standard C# Serilog / Microsoft.Extensions.Logging output:
 * e.g. "2026-09-01 20:24:00.552 +03:00 [Information] RollercoinProgressionEventJob..."
 */
const C_SHARP_LOG_REGEX = /^(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:\s*[+-]\d{2}:?\d{2}|Z)?)\s+\[([A-Za-z]+)\]\s*(.*)$/;

/**
 * Regex for a C# stack trace frame:
 * e.g. "   at Namespace.Class.Method(Type arg) in C:\path\file.cs:line 40"
 * or "   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.Execute(...)"
 */
const STACK_FRAME_REGEX = /^\s*at\s+(.+?)(?:\s+in\s+(.+?):line\s+(\d+))?$/;

/**
 * Parses raw stack trace text into structured StackTraceFrame list and exception metadata.
 */
export function parseStackTraceString(
  stackText: string,
  meta?: { methodName?: string; user?: string; fullName?: string }
): ParsedException {
  const rawLines = stackText.split(/\r\n|\r|\n/);
  const frames: StackTraceFrame[] = [];

  let exceptionType = 'System.Exception';
  let shortType = 'Exception';
  let message = '';
  let headerFound = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Check if this is a stack trace frame line: "at ..."
    const frameMatch = line.match(STACK_FRAME_REGEX);
    if (frameMatch) {
      const method = frameMatch[1].trim();
      const filePath = frameMatch[2]?.trim();
      const lineNumber = frameMatch[3] ? parseInt(frameMatch[3], 10) : undefined;

      // Extract fileName from filePath (handling both / and \)
      let fileName: string | undefined;
      if (filePath) {
        const parts = filePath.split(/[/\\]/);
        fileName = parts[parts.length - 1];
      }

      // App code vs framework/system code detection
      const isAppCode =
        !method.startsWith('Microsoft.') &&
        !method.startsWith('System.') &&
        !method.startsWith('Npgsql.') &&
        !method.startsWith('Serilog.') &&
        (Boolean(filePath) ||
          method.includes('Rollercoin') ||
          method.includes('Core.'));

      frames.push({
        id: frames.length + 1,
        raw: line,
        method,
        filePath,
        fileName,
        lineNumber,
        isAppCode,
      });
    } else if (!headerFound) {
      // First non-frame line is typically: "Namespace.ExceptionName: Message"
      headerFound = true;
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        exceptionType = line.substring(0, colonIndex).trim();
        message = line.substring(colonIndex + 1).trim();
      } else {
        exceptionType = line;
        message = line;
      }
      const dotIndex = exceptionType.lastIndexOf('.');
      shortType = dotIndex > -1 ? exceptionType.substring(dotIndex + 1) : exceptionType;
    }
  }

  return {
    type: exceptionType,
    shortType,
    message: message || shortType,
    methodName: meta?.methodName,
    user: meta?.user,
    fullName: meta?.fullName,
    rawStackTrace: stackText,
    frames,
  };
}

/**
 * Checks if a string contains NArchitecture/Clean Architecture JSON error log:
 * e.g. {"FullName":"","MethodName":"Invoke","User":"?","Parameters":[{"Name":"","Value":"Core...Exception: ...\r\n   at ...","Type":"DefaultHttpContext"}]}
 */
export function detectAndParseNArchitectureJson(text: string): ParsedException | null {
  if (!text) return null;

  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonCandidate);

      // Check if it's NArchitecture LogDetail structure
      if (parsed && typeof parsed === 'object') {
        const methodName = parsed.MethodName || parsed.methodName;
        const user = parsed.User || parsed.user;
        const fullName = parsed.FullName || parsed.fullName;
        const parameters = parsed.Parameters || parsed.parameters;

        if (Array.isArray(parameters)) {
          for (const param of parameters) {
            const val = param?.Value ?? param?.value;
            if (typeof val === 'string' && (val.includes('at ') || val.includes('Exception'))) {
              return parseStackTraceString(val, { methodName, user, fullName });
            }
          }
        }

        // Direct exception field
        if (typeof parsed.Exception === 'string' || typeof parsed.exception === 'string') {
          return parseStackTraceString(parsed.Exception || parsed.exception, { methodName, user, fullName });
        }
      }
    } catch {
      // Not valid JSON
    }
  }

  // Check if text is directly an unescaped C# stack trace
  if (text.includes('at ') && (text.includes('Exception') || text.includes('Error'))) {
    return parseStackTraceString(text);
  }

  return null;
}

/**
 * Parses raw text content of a C# log file into structured lines,
 * recognizing both Serilog text lines and NArchitecture C# exception JSONs.
 */
export function parseCSharpLogs(content: string): ParsedLogLine[] {
  if (!content) return [];

  // Normalize line breaks
  const rawLines = content.split(/\r\n|\r|\n/);
  const result: ParsedLogLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Skip trailing empty line if it's the very last
    if (i === rawLines.length - 1 && line.trim() === '') {
      continue;
    }

    const match = line.match(C_SHARP_LOG_REGEX);
    if (match) {
      const [, timestamp, levelRaw, message] = match;
      const detectedException = detectAndParseNArchitectureJson(message);

      result.push({
        id: i + 1,
        raw: line,
        timestamp: timestamp.trim(),
        level: detectedException ? 'Error' : normalizeLogLevel(levelRaw),
        message: detectedException
          ? `${detectedException.shortType}: ${detectedException.message}`
          : message,
        isContinuation: false,
        exception: detectedException || undefined,
      });
    } else {
      // Check if this line is an NArchitecture JSON exception or raw stack trace
      const detectedException = detectAndParseNArchitectureJson(line);

      if (detectedException) {
        result.push({
          id: i + 1,
          raw: line,
          level: 'Error',
          message: `${detectedException.shortType}: ${detectedException.message}`,
          isContinuation: false,
          exception: detectedException,
        });
      } else {
        // Normal continuation line (e.g., stack trace fragment or wrapped output)
        result.push({
          id: i + 1,
          raw: line,
          level: 'Other',
          message: line,
          isContinuation: true,
        });
      }
    }
  }

  return result;
}

/**
 * Get visual styling parameters for each log level.
 */
export function getLogLevelBadgeStyle(level: LogLevel): {
  label: string;
  color: string;
  bg: string;
  borderColor: string;
} {
  switch (level) {
    case 'Information':
      return {
        label: 'INF',
        color: '#38bdf8', // sky-400
        bg: 'rgba(56, 189, 248, 0.12)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
      };
    case 'Warning':
      return {
        label: 'WRN',
        color: '#fbbf24', // amber-400
        bg: 'rgba(251, 191, 36, 0.12)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
      };
    case 'Error':
      return {
        label: 'ERR',
        color: '#f87171', // red-400
        bg: 'rgba(248, 113, 113, 0.15)',
        borderColor: 'rgba(248, 113, 113, 0.35)',
      };
    case 'Fatal':
      return {
        label: 'FTL',
        color: '#fda4af', // rose-300
        bg: 'rgba(225, 29, 72, 0.25)',
        borderColor: 'rgba(244, 63, 94, 0.5)',
      };
    case 'Debug':
      return {
        label: 'DBG',
        color: '#c084fc', // purple-400
        bg: 'rgba(192, 132, 252, 0.12)',
        borderColor: 'rgba(192, 132, 252, 0.3)',
      };
    case 'Verbose':
    case 'Trace':
      return {
        label: 'TRC',
        color: '#94a3b8', // slate-400
        bg: 'rgba(148, 163, 184, 0.12)',
        borderColor: 'rgba(148, 163, 184, 0.25)',
      };
    case 'Other':
    default:
      return {
        label: 'LOG',
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.1)',
        borderColor: 'transparent',
      };
  }
}
