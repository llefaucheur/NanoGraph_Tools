#!/usr/bin/env python3
from pathlib import Path
import json
import yaml

ROOT = Path(__file__).resolve().parents[1]
out_file = ROOT / "red" / "node-manifests.js"

manifests = {}

for path in sorted((ROOT / "manifests").glob("*.yaml")):
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    name = data.get("node")
    if not name:
        raise ValueError("%s has no 'node:' field" % path)
    data["component_kind"] = "node"
    manifests[name] = data

for path in sorted((ROOT / "subgraphs").glob("*.yaml")):
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    name = data.get("subgraph")
    if not name:
        raise ValueError("%s has no 'subgraph:' field" % path)
    data["component_kind"] = "subgraph"
    data["manifest_file"] = "subgraphs/%s" % path.name
    manifests[name] = data

out_file.write_text(
    "/* GENERATED from manifests/*.yaml and subgraphs/*.yaml - do not edit. */\n"
    "window.NG_NODE_MANIFESTS = " +
    json.dumps(manifests, indent=2, ensure_ascii=False) +
    ";\n",
    encoding="utf-8"
)
print("generated", out_file)
