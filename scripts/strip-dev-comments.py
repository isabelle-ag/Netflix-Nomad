#!/usr/bin/env python3
import re, sys, os

patterns = [
    r'//\s*DEV:.*',           # single-line // DEV:
    r'//\s*TODO:.*',          # single-line // TODO:
    r'/\*\s*DEV:.*?\*/',      # block /* DEV: ... */ (single or multi-line)
    r'/\*\s*TODO:.*?\*/',     # block /* TODO: ... */ (single or multi-line)
    r'#\s*DEV:.*',            # shell/python # DEV:
    r'#\s*TODO:.*',           # shell/python # TODO:
]

combined = re.compile('|'.join(patterns), re.DOTALL)

target = sys.argv[1] if len(sys.argv) > 1 else '.'

extensions = ('.js', '.ts', '.jsx', '.tsx', '.css', '.py', '.sh')

for root, dirs, files in os.walk(target):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'scripts')]
    for fname in files:
        if fname.endswith(extensions):
            path = os.path.join(root, fname)
            with open(path, 'r') as f:
                content = f.read()
            cleaned = combined.sub('', content)
            if cleaned != content:
                with open(path, 'w') as f:
                    f.write(cleaned)
                print(f'  Cleaned: {path}')