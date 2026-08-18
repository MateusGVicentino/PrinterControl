#!/usr/bin/env python3
import json
import re

with open("../src/data/printers.ts", "r", encoding="utf-8") as f:
    content = f.read()

printers = []

# Dividir por cada printer object (entre { e })
# Estratégia: encontrar cada "id:" e extrair até o próximo "id:" ou fim do array
pattern = r'{\s*id:\s*"(\d+)".*?(?=},\s*{|];)'
matches = re.finditer(pattern, content, re.DOTALL)

for match in matches:
    block = match.group(0)

    printer = {}

    # Extrair cada campo com regex
    id_match = re.search(r'id:\s*"(\d+)"', block)
    if id_match:
        printer["id"] = int(id_match.group(1))

    name_match = re.search(r'name:\s*"([^"]+)"', block)
    if name_match:
        printer["name"] = name_match.group(1)

    ip_match = re.search(r'ip:\s*"([^"]+)"', block)
    if ip_match:
        printer["ip"] = ip_match.group(1)

    model_match = re.search(r'model:\s*"([^"]+)"', block)
    if model_match:
        printer["model"] = model_match.group(1)

    dept_match = re.search(r'department:\s*"([^"]+)"', block)
    if dept_match:
        printer["department"] = dept_match.group(1)

    status_match = re.search(r'status:\s*"(\w+)"', block)
    if status_match:
        printer["status"] = status_match.group(1)

    pages_match = re.search(r'pagesPrinted:\s*(\d+)', block)
    if pages_match:
        printer["page_count"] = int(pages_match.group(1))

    if "id" in printer:
        printers.append(printer)

print(f"[OK] Extracted {len(printers)} printers")

output = {"printers": printers, "count": len(printers)}
with open("printers_data.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"[OK] Saved to printers_data.json")
print("\nSample:")
for p in printers[:3]:
    print(f"  - {p['name']} ({p['ip']})")
