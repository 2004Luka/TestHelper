import { ipKeyGenerator } from 'express-rate-limit';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const isRequestOriginAllowed = (request, allowedOrigins) => {
  if (!unsafeMethods.has(request.method)) return true;

  let sourceOrigin = request.origin || null;
  if (!sourceOrigin && request.referer) {
    try {
      sourceOrigin = new URL(request.referer).origin;
    } catch {
      sourceOrigin = null;
    }
  }

  if (sourceOrigin) return allowedOrigins.includes(sourceOrigin);
  return !request.hasCookieSession;
};

export const getLoginAccountRateLimitKey = (request) => {
  const account = typeof request.body?.name === 'string' ? request.body.name : request.body?.username;
  if (typeof account !== 'string' || !account.trim()) {
    return `ip:${ipKeyGenerator(request.ip)}`;
  }

  const requestPath = `${request.baseUrl || ''}${request.path || ''}${request.originalUrl || ''}`;
  const accountType = requestPath.includes('/students/login') ? 'student' : 'teacher';
  return `account:${accountType}:${account.trim().toLowerCase()}`;
};
