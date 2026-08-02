import fs from 'fs';

const filePath = '/root/open-design/apps/daemon/src/runtimes/defs/claude.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = "args.push('--permission-mode', 'bypassPermissions');";
const replacement = "if (typeof process.getuid === 'function' && process.getuid() === 0 && !process.env.IS_SANDBOX) {\n        args.push('--permission-mode', 'auto');\n      } else {\n        args.push('--permission-mode', 'bypassPermissions');\n      }";

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('CLAUDE_TS_PATCHED_SUCCESSFULLY');
} else {
  console.log('TARGET_NOT_FOUND_OR_ALREADY_PATCHED');
}
