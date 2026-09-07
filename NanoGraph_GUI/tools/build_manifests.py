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

    # Backward-compatible normalization: entries using "format:" inside
    # parameters are stream-format descriptors, not editable node parameters.
    # Move them to a dedicated top-level "formats" list so the generic GUI
    # can display them without trying to create an input field named undefined.
    params = data.get("parameters") or []
    formats = list(data.get("formats") or [])
    real_params = []
    for entry in params:
        if isinstance(entry, dict) and entry.get("format") and not entry.get("name"):
            formats.append(entry)
        else:
            if not isinstance(entry, dict) or not entry.get("name"):
                raise ValueError("%s has a parameter without 'name:'" % path)
            real_params.append(entry)
    data["parameters"] = real_params
    if formats:
        data["formats"] = formats

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
