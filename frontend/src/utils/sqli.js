/**
 * Client-Side UI SQL Injection Simulator & Easter Egg Handler.
 * Intercepts common SQLi payloads entirely on the frontend
 * without altering, corrupting, or exposing the SQLite backend database.
 */

export function detectSqlInjection(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();

  // 1. Destructive queries (DROP TABLE, DELETE FROM, TRUNCATE, etc.)
  if (
    s.includes('drop table') ||
    s.includes('delete from') ||
    s.includes('truncate table') ||
    s.startsWith('drop ')
  ) {
    return {
      type: 'DESTRUCTIVE',
      payload: input.trim(),
      message: `💉 [UI SQL Injection Safe]: Executed simulated '${input.trim()}' on client-side view. 0 records affected on SQLite backend!`,
    };
  }

  // 2. Admin authentication bypass (admin' --, admin'#, etc.)
  if (
    s.includes("admin' --") ||
    s.includes("admin'#") ||
    s.includes("admin'/*") ||
    s === "admin'" ||
    s.includes("' union select") ||
    s.includes("union select")
  ) {
    return {
      type: 'ADMIN_BYPASS',
      payload: input.trim(),
      message: `💉 [UI SQL Injection]: Bypassed authentication check using '${input.trim()}'. Access granted as Administrator!`,
    };
  }

  // 3. Tautology / Boolean logic bypass (' or '1'='1, ' or 1=1 --, etc.)
  if (
    s.includes("' or '1'='1") ||
    s.includes("' or 1=1") ||
    s.includes("or 1=1") ||
    s.includes("' or ''='") ||
    s.includes('" or ""="') ||
    s.includes('" or "1"="1') ||
    s === '1=1' ||
    s.includes("1' or '1'='1") ||
    s.includes("' or true --") ||
    s.includes("' or 'x'='x")
  ) {
    return {
      type: 'TAUTOLOGY',
      payload: input.trim(),
      message: `💉 [UI SQL Injection Bypass]: Query evaluated to TRUE (1=1). Access Granted!`,
    };
  }

  return null;
}
