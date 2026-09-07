# Subgraph prototype: `arm_filter_cascade`

This prototype adds a reusable subgraph described by a single Common Component Manifest:

- `subgraphs/arm_filter_cascade.yaml`

The manifest publishes one input, one output and two parameters. Its internal `graph:` contains two `arm_filter` nodes in cascade.

## GUI behavior

`arm_filter_cascade` is automatically registered in a new **subgraph** palette category. No node-specific edit form is added to `GUI.html`.

Drop the subgraph in the parent graph and double-click its box. The GUI opens a new workspace tab and instantiates the internal graph. Reopening the same subgraph instance returns to the same workspace.

Internal instance names are mangled using the parent instance name. For example, parent `arm_filter_cascade_3` produces:

```text
arm_filter_cascade_3__arm_filter_0
arm_filter_cascade_3__arm_filter_1
```

The `$in.0` and `$out.0` endpoints in the manifest are rendered as boundary nodes in the subgraph workspace.

## Build step

Run:

```sh
python tools/build_manifests.py
```

The script now merges both `manifests/*.yaml` and `subgraphs/*.yaml` into `red/node-manifests.js`, preserving the GUI's ability to run directly from `file://`.

## Flattening rule for the compiler

For a parent instance named `arm_filter_cascade_3`, flatten:

```text
$in.0 -> arm_filter_0 -> arm_filter_1 -> $out.0
```

to:

```text
parent incoming arc
  -> arm_filter_cascade_3__arm_filter_0
  -> arm_filter_cascade_3__arm_filter_1
  -> parent outgoing arc
```

The GUI prototype visualizes this hierarchy; the actual YAML-to-NanoGraph / CMSIS-Stream compiler should perform the flattening and boundary redirection.


## Keyboard navigation

When a subgraph workspace is open, press **Alt+Left** to return to its parent graph.
For nested subgraphs, each press moves up exactly one hierarchy level. At the
top-level graph the shortcut does nothing, leaving normal browser behavior available.

## Export correction

Export is scoped to the top-level graph containing the currently displayed
workspace. Nodes from unrelated graph tabs are no longer merged into the YAML.

Subgraphs are also identified consistently on arc endpoints. For example:

```yaml
- OPort_0 IO: data_in_0
  IPort_0 subgraph: arm_filter_cascade_0

- OPort_0 subgraph: arm_filter_cascade_0
  IPort_0 IO: data_out_0
```

The subgraph will be flattened later by the graph compiler; the GUI YAML keeps
the hierarchy explicit.

## Flattened export (updated)

`Export Graph` now compiles hierarchy away before producing YAML.  A subgraph
instance is therefore never emitted as a `subgraph:` node in the exported
runtime graph.  For example:

    data_in[0] -> arm_filter_cascade[0] -> data_out[0]

is exported as:

    data_in_0_0
       -> arm_filter_cascade_0__arm_filter_0
       -> arm_filter_cascade_0__arm_filter_1
       -> io_data_out_0

The reusable subgraph manifest remains in `subgraphs/arm_filter_cascade.yaml`;
the flattened YAML is the graph intended for NanoGraph/CMSIS-Stream.

Disconnected computing nodes and disconnected subgraph boxes are not exported.
This prevents stale editor objects from leaking into the generated graph.

## Returning to the parent graph

A visible **Parent Graph** button appears next to **Export Graph** whenever a
subgraph is open.  Click it to return one hierarchy level upward.  This is the
primary navigation mechanism and does not depend on browser/OS keyboard
shortcuts.


## Navigation and export robustness update

The subgraph editor now stores an explicit `subgraph workspace -> parent workspace`
map when a subgraph is opened. The visible **Back to Parent Graph** button uses
this direct map rather than relying on Alt+Left or browser history.

Temporary subgraph-editor nodes are marked and are excluded from export. The
flattening pass also rejects stale `subgraph_input`, `subgraph_output`, and
`<subgraph-instance>__...` editor objects that may remain from an older browser
session. A final de-duplication pass guarantees one flattened node/arc entry.


## Navigation and persistence fix

The **Back to Parent Graph** button now records the actual active workspace when a subgraph is opened. Subgraph editor workspaces are transient views and are excluded from browser localStorage. On startup, stale transient subgraph workspaces saved by older prototypes are automatically removed before import.

Reloading `GUI.html` is therefore no longer a navigation mechanism; use **Back to Parent Graph**. Reloading reconstructs only the persistent top-level design and intentionally does not persist an open subgraph editor tab.

## Fix 5: real main workspace, parent navigation, nested subgraphs

The GUI now creates a real root workspace named `main_graph` before loading the
saved graph.  Older versions used workspace id `0` as an implicit canvas; there
was therefore no actual tab to activate when `Back to Parent Graph` was
pressed.  The visible `main_graph` tab fixes that ambiguity.

Each temporary subgraph workspace stores its direct `parentWorkspaceId`.
`Back to Parent Graph` activates this exact tab.  The relationship also works
recursively for nested subgraphs.

The flattened exporter now prefers the current in-memory contents of an open
subgraph editor workspace.  Therefore a subgraph dropped inside another
subgraph is recursively flattened instead of being lost.  For example, a
new `arm_filter_cascade[1]` placed inside `arm_filter_cascade[0]` produces
names such as:

```
arm_filter_cascade_0__arm_filter_cascade_1__arm_filter_0
arm_filter_cascade_0__arm_filter_cascade_1__arm_filter_1
```

The `$in`/`$out` editor boundary nodes remain visualization-only and are not
emitted as runtime nodes.

Subgraph editor workspaces are still transient and are not written into the
browser local-storage copy of the main graph.  Their canonical starting point
remains the Common Component Manifest.  A later `Export Subgraph` operation
can be added if edited reusable subgraphs must be saved back as separate YAML.
