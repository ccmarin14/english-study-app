#!/bin/bash
# Chrome DevTools MCP Bridge

DEBUG_PORT=9222
WS_URL="ws://127.0.0.1:9222/devtools/browser/7cd9a5b5-2840-489c-aa3b-1a204d234c43"

case "$1" in
  "navigate")
    TAB_ID=$(curl -s "http://localhost:$DEBUG_PORT/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$TAB_ID" ]; then
      TAB_ID=$(curl -s "http://localhost:$DEBUG_PORT/json" | grep -oP '"id":\s*"\K[^"]+' | head -1)
    fi
    echo "Tab ID: $TAB_ID"
    curl -s "http://localhost:$DEBUG_PORT/json/new?url=$2" 2>/dev/null
    ;;
  "tabs")
    curl -s "http://localhost:$DEBUG_PORT/json" | python3 -c "import sys,json; tabs=json.load(sys.stdin); print('\n'.join([f\"{i}: {t.get('title','')[:50]} - {t.get('url','')}\" for i,t in enumerate(tabs)]))"
    ;;
  "screenshot")
    TAB_ID=$(curl -s "http://localhost:$DEBUG_PORT/json" | grep -oP '"id":\s*"\K[^"]+' | head -1)
    curl -s "http://localhost:$DEBUG_PORT/json/screenshot" -X POST -H "Content-Type: application/json" -d "{}" | base64 -d > "$2"
    echo "Screenshot saved to $2"
    ;;
  "eval")
    TAB=$(curl -s "http://localhost:$DEBUG_PORT/json" | python3 -c "import sys,json; tabs=json.load(sys.stdin); print(tabs[0]['id'])" 2>/dev/null)
    if [ -n "$TAB" ]; then
      RESULT=$(curl -s "http://localhost:$DEBUG_PORT/json/runtime/evaluate" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"expression\": $(echo "$2" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")}")
      echo "$RESULT" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('result',{}).get('value',''))" 2>/dev/null
    fi
    ;;
  *)
    echo "Usage: $0 {navigate|tabs|screenshot|eval} [args]"
    ;;
esac
