# Common Node Manifest GUI prototype

This prototype keeps `GUI.html` and the editor JavaScript generic.

The filter-specific information is in:

- `manifests/arm_filter.yaml`

`tools/build_manifests.py` scans every `manifests/*.yaml` file and generates:

- `red/node-manifests.js`

Run after adding/changing a manifest:

```sh
python tools/build_manifests.py
```

For `arm_filter`, double-clicking a node creates `mode`, `cutoff`, `q` and
`gain_db` controls from the manifest. Clicking a parameter displays its
`help:` text in the right-hand Info sidebar.

The graph export now writes manifested parameters as standard nested YAML:

```yaml
- node: arm_filter_0
  parameters:
    mode: "lowpass"
    cutoff: 0.0625
    q: 1.414
    gain_db: 20
```

Nodes without a Common Node Manifest continue using the legacy `params` /
`paramtxt` fields, so the prototype is backward compatible.
