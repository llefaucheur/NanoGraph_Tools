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

## Interface identity versus C binding

An interface is identified portably by `name` plus logical `index`. For example:

```yaml
- interface:
    name: io_data_in
    index: 1
    c_platform_index: 2
```

corresponds to `io_data_in[1]` in graph YAML. `c_platform_index` is private to the
selected platform implementation. Format defaults are resolved by the graph compiler
after this lookup; they are not automatically duplicated onto exported arcs.
