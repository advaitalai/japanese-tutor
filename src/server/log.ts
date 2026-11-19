// Prefixed log lines, one per decision a person might question (see the HLD's Logs table).
export function log(prefix: string, line: string) {
  console.log(`[${prefix}] ${line}`);
}
