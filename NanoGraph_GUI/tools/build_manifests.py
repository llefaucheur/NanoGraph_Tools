#!/usr/bin/env python3
from pathlib import Path
import json
import yaml

ROOT = Path(__file__).resolve().parents[1]
out_file = ROOT / "red" / "node-manifests.js"
platform_out_file = ROOT / "red" / "platform-manifests.js"

manifests = {}

for path in sorted((ROOT / "manifests").glob("*.yaml")):
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    name = data.get("node")
    if not name:
        raise ValueError("%s has no 'node:' field" % path)
    if name != path.stem:
        raise ValueError("%s declares node '%s' (expected '%s')" % (path, name, path.stem))
    if name in manifests:
        raise ValueError("duplicate node/subgraph name '%s' in %s" % (name, path))
    data["component_kind"] = "node"

    params = data.get("parameters") or []
    for entry in params:
        if not isinstance(entry, dict) or not entry.get("name"):
            raise ValueError("%s has a parameter without 'name:'" % path)

    manifests[name] = data

for path in sorted((ROOT / "subgraphs").glob("*.yaml")):
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    name = data.get("subgraph")
    if not name:
        raise ValueError("%s has no 'subgraph:' field" % path)
    if name != path.stem:
        raise ValueError("%s declares subgraph '%s' (expected '%s')" % (path, name, path.stem))
    if name in manifests:
        raise ValueError("duplicate node/subgraph name '%s' in %s" % (name, path))
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

# Platform manifests are also needed by the browser exporter so that logical
# IO instances can be resolved to their format constraints/defaults.
platforms = {}
for path in sorted((ROOT / "platforms").glob("*.yaml")):
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    name = data.get("platform")
    if not name:
        raise ValueError("%s has no 'platform:' field" % path)
    if name != path.stem:
        raise ValueError("%s declares platform '%s' (expected '%s')" % (path, name, path.stem))
    if name in platforms:
        raise ValueError("duplicate platform name '%s' in %s" % (name, path))
    platforms[name] = data

platform_out_file.write_text(
    "/* GENERATED from platforms/*.yaml - do not edit. */\n"
    "window.NG_PLATFORM_MANIFESTS = " +
    json.dumps(platforms, indent=2, ensure_ascii=False) +
    ";\n",
    encoding="utf-8"
)
print("generated", platform_out_file)
