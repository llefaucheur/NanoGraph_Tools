# Platform selector

A platform is a singleton graph-level selector. It is not a computing node and
does not receive an instance suffix.

Example GUI component type: `Computer`

Exported YAML:

```yaml
platform: Computer

nodes:
  # processing and I/O nodes only
```

The graph compiler can use `Computer` to load `platforms/Computer.yaml`.
Only one platform is allowed in a graph, and platform nodes are only valid in
`main_graph`, not inside a subgraph.
