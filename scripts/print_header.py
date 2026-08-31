import json
import re

with open("yt_dump.html", "r", encoding="utf-8") as f:
    html = f.read()

match = re.search(r'ytInitialData\s*=\s*({.+?});(?:</script>|\n)', html)
if match:
    data = json.loads(match.group(1))
    print(json.dumps(data.get("header", {}), indent=2)[:2000])
    print(json.dumps(data.get("alerts", {}), indent=2))
