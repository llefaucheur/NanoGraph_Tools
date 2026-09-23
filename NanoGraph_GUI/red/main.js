/** Modified from original Node-Red source, for audio system visualization
 * vim: set ts=4:
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
var RED = (function() {

    $('#btn-keyboard-shortcuts').click(function(){showHelp();});

    function hideDropTarget() {
        $("#dropTarget").hide();
        RED.keyboard.remove(/* ESCAPE */ 27);
    }

    $('#chart').on("dragenter",function(event) {
        if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
            $("#dropTarget").css({display:'table'});
            RED.keyboard.add(/* ESCAPE */ 27,hideDropTarget);
        }
    });

    $('#dropTarget').on("dragover",function(event) {
        if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
            event.preventDefault();
        }
    })
    .on("dragleave",function(event) {
        hideDropTarget();
    })
    .on("drop",function(event) {
        var data = event.originalEvent.dataTransfer.getData("text/plain");
        hideDropTarget();
        RED.view.importNodes(data);
        event.preventDefault();
    });
    function make_name(n) {
        var name = (n.name ? n.name : n.id);
        name = String(name);
        name = name.replace(/\[([0-9]+)\]$/, "_$1");
        name = name.replace(/[\s+\-]+/g, "_");
        return name;
    }

    /* Platform IO identity is intentionally different from computing-node
     * C/compiler naming. Keep the logical instance syntax io_name[index]
     * in exported graph YAML; the platform manifest resolves it to its
     * platform-specific c_platform_index. */
    function make_io_name(n) {
        var name = (n.name ? n.name : n.id);
        name = String(name);
        name = name.replace(/[\s+\-]+/g, "_");

        return name;
    }

    function isPlatformNode(n) {
        return !!(n && n.kind === "platform");
    }

    function platformName(n) {
        /* A platform is a singleton selector, not an indexed instance.
         * Always export the component type (Computer, M85Board, ...), never
         * the graphical node id/name such as Computer[0]. */
        if (!n) return "";
        return String(n.type || (n._def && n._def.shortName) || n.name || n.id);
    }

    function isEmpty(value) {
        return (value === null || value === undefined ||
                (typeof value === "string" && value.length === 0));
    }
    function appendField(yml, obj, key) {
        if (!isEmpty(obj[key])) {
            yml += "    " + key + ": " + String(obj[key]) + "\n";
        }
        return yml;
    }
    function yamlScalar(value, parameter) {
        var ptype = parameter ? parameter.type : null;
        if (ptype === "int" || ptype === "float" || ptype === "number") {
            return String(value);
        }
        if (ptype === "bool" || ptype === "boolean") {
            return (value === true || String(value).toLowerCase() === "true") ? "true" : "false";
        }
        var text = String(value);
        return '"' + text.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '"';
    }

    function appendManifestParameters(yml, node) {
        var manifest = (window.NG_NODE_MANIFESTS || {})[node.type];
        if (!manifest || !manifest.parameters || !manifest.parameters.length) {
            return yml;
        }

        var fields = [];
        for (var i=0; i<manifest.parameters.length; i++) {
            var p = manifest.parameters[i];
            var value = node[p.name];
            if (!isEmpty(value)) {
                fields.push({parameter:p, value:value});
            }
        }

        if (fields.length) {
            yml += "    parameters:\n";
            for (var j=0; j<fields.length; j++) {
                yml += "      " + fields[j].parameter.name + ": " +
                       yamlScalar(fields[j].value, fields[j].parameter) + "\n";
            }
        }
        return yml;
    }

    function isInternalSubgraphNode(node) {
        if (!node || node.z == null) return false;
        var ws = RED.nodes.workspace(node.z);
        return !!(ws && ws.subgraphOwner);
    }

    /*
     * Return the root (top-level) workspace containing the currently
     * displayed workspace. This prevents Export from accidentally merging
     * nodes that live on other top-level graph tabs. If Export is pressed
     * while a subgraph is open, the containing top graph is exported.
     */
    function exportRootWorkspaceId() {
        var workspaceId = RED.view.getWorkspace();
        var ws = RED.nodes.workspace(workspaceId);
        var owner;

        while (ws && ws.subgraphOwner) {
            owner = RED.nodes.node(ws.subgraphOwner);
            if (!owner || owner.z == null) break;
            workspaceId = owner.z;
            ws = RED.nodes.workspace(workspaceId);
        }
        return workspaceId;
    }

    function yamlEndpointKind(node) {
        if (isPlatformNode(node)) return "platform";
        if (node && node.kind === "IO") return "IO";
        if (node && node.kind === "subgraph") return "subgraph";
        return "node";
    }

    function parseWire(wire) {
        if (typeof wire === "string") {
            var parts = wire.split(":");
            return {
                target: parts[0],
                targetPort: parts[1],
                bufferSize: "",
                arcName: "",
                dataType: "",
                refresh: "",
                jitterPercent: "",
                overlayWith: "",
                formatID: "",
                script: ""
            };
        }
        return {
            target: wire.target || wire.id,
            targetPort: wire.targetPort,
            bufferSize: wire.bufferSize || "",
            arcName: wire.arcName || "",
            dataType: wire.dataType || "",
            refresh: wire.refresh || "",
            jitterPercent: wire.jitterPercent || "",
            overlayWith: wire.overlayWith || "",
            formatID: wire.formatID || "",
            script: wire.script || ""
        };
    }
    function copyObject(src) {
        var dst = {};
        var k;
        if (!src) return dst;
        for (k in src) {
            if (src.hasOwnProperty(k)) dst[k] = src[k];
        }
        return dst;
    }

    function manifestForType(type) {
        return (window.NG_NODE_MANIFESTS || {})[type];
    }

    function baseComponentType(instanceName) {
        return String(instanceName).replace(/_[0-9]+$/,"");
    }

    function splitGraphEndpoint(ref) {
        var text = String(ref);
        var m;
        if (text.indexOf("$in.") === 0) {
            return {boundary:"in", port:parseInt(text.substring(4),10)};
        }
        if (text.indexOf("$out.") === 0) {
            return {boundary:"out", port:parseInt(text.substring(5),10)};
        }
        m = text.match(/^(.*)\.([0-9]+)$/);
        if (!m) throw new Error("Invalid graph endpoint: " + text);
        return {name:m[1], port:parseInt(m[2],10)};
    }

    function arcAttributes(obj) {
        obj = obj || {};
        return {
            bufferSize: obj.bufferSize != null ? obj.bufferSize : (obj.buffer_size != null ? obj.buffer_size : ""),
            arcName: obj.arcName != null ? obj.arcName : (obj.arc_name != null ? obj.arc_name : ""),
            dataType: obj.dataType != null ? obj.dataType : (obj.data_type != null ? obj.data_type : ""),
            sampleRate: obj.sampleRate != null ? obj.sampleRate : (obj.sample_rate != null ? obj.sample_rate : ""),
            nbChannels: obj.nbChannels != null ? obj.nbChannels : (obj.nb_channels != null ? obj.nb_channels : ""),
            interleaving: obj.interleaving != null ? obj.interleaving : "",
            refresh: obj.refresh || "",
            formatID: obj.formatID || "",
            jitterPercent: obj.jitterPercent != null ? obj.jitterPercent : (obj.jitter_percent != null ? obj.jitter_percent : ""),
            overlayWith: obj.overlayWith != null ? obj.overlayWith : (obj.overlay_with != null ? obj.overlay_with : ""),
            script: obj.script || ""
        };
    }

    function endpoint(name, kind, port) {
        return {name:name, kind:kind, port:port};
    }

    function addFlatArc(flat, src, dst, attrs) {
        if (!src || !dst) return;
        flat.arcs.push({source:src, destination:dst, attrs:arcAttributes(attrs)});
    }

    function connectEndpointLists(flat, sources, destinations, attrs) {
        var i, j;
        sources = sources || [];
        destinations = destinations || [];
        for (i=0; i<sources.length; i++) {
            for (j=0; j<destinations.length; j++) {
                addFlatArc(flat, sources[i], destinations[j], attrs);
            }
        }
    }

    function instanceParameterValues(manifest, instance) {
        var result = {};
        var params = (manifest && manifest.parameters) || [];
        var i, p, v;
        for (i=0; i<params.length; i++) {
            p = params[i];
            v = instance ? instance[p.name] : null;
            if (isEmpty(v) && p.default != null) v = p.default;
            if (v != null) result[p.name] = v;
        }
        return result;
    }

    /*
     * Expand one reusable subgraph directly from its Common Component
     * Manifest. The visible subgraph workspace is only an editor view; it is
     * deliberately NOT used as compiler input. This avoids accidental export
     * of duplicate/temporary workspace objects.
     *
     * Returns the published boundary maps after name mangling:
     *     inputs[0]  -> internal destination endpoint(s)
     *     outputs[0] -> internal source endpoint(s)
     */
    function expandSubgraph(flat, fullInstanceName, type, instance) {
        var manifest = manifestForType(type);
        var graph, graphNodes, graphArcs;
        var local = {};
        var bindingOverrides = {};
        var publishedInputs = {};
        var publishedOutputs = {};
        var instanceValues;
        var i, j, gn, localName, localType, fullName, childManifest;

        if (!manifest || manifest.component_kind !== "subgraph" || !manifest.graph) {
            throw new Error("Missing subgraph manifest for " + type);
        }

        graph = manifest.graph;
        graphNodes = graph.nodes || [];
        graphArcs = graph.arcs || [];
        instanceValues = instanceParameterValues(manifest, instance || {});

        /* Translate published subgraph parameters into internal parameters. */
        var publishedParams = manifest.parameters || [];
        for (i=0; i<publishedParams.length; i++) {
            var pp = publishedParams[i];
            if (!pp.bind) continue;
            var bm = String(pp.bind).match(/^(.*)\.([^.]+)$/);
            if (!bm) continue;
            if (!bindingOverrides[bm[1]]) bindingOverrides[bm[1]] = {};
            if (instanceValues.hasOwnProperty(pp.name)) {
                bindingOverrides[bm[1]][bm[2]] = instanceValues[pp.name];
            }
        }

        /* First create/expand every internal component. */
        for (i=0; i<graphNodes.length; i++) {
            gn = graphNodes[i];
            localName = gn.node || gn.subgraph;
            if (!localName) throw new Error("Subgraph node without a name in " + type);
            localType = baseComponentType(localName);
            fullName = fullInstanceName + "__" + localName;
            childManifest = manifestForType(localType);

            var childParams = copyObject(gn.parameters || {});
            if (bindingOverrides[localName]) {
                for (var bk in bindingOverrides[localName]) {
                    if (bindingOverrides[localName].hasOwnProperty(bk)) {
                        childParams[bk] = bindingOverrides[localName][bk];
                    }
                }
            }

            if (childManifest && childManifest.component_kind === "subgraph") {
                local[localName] = expandSubgraph(flat, fullName, localType, childParams);
            } else {
                flat.nodes.push({
                    kind:"node",
                    type:localType,
                    name:fullName,
                    props:childParams
                });
                local[localName] = {
                    inputs:null,
                    outputs:null,
                    direct:true,
                    name:fullName,
                    kind:"node"
                };
            }
        }

        function localInputTargets(ref) {
            var d = local[ref.name];
            if (!d) throw new Error("Unknown internal node " + ref.name + " in " + type);
            if (d.direct) return [endpoint(d.name,d.kind,ref.port)];
            return d.inputs[ref.port] || [];
        }

        function localOutputSources(ref) {
            var d = local[ref.name];
            if (!d) throw new Error("Unknown internal node " + ref.name + " in " + type);
            if (d.direct) return [endpoint(d.name,d.kind,ref.port)];
            return d.outputs[ref.port] || [];
        }

        /* Then resolve internal arcs and the published boundaries. */
        for (i=0; i<graphArcs.length; i++) {
            var ga = graphArcs[i];
            var sr = splitGraphEndpoint(ga.from);
            var dr = splitGraphEndpoint(ga.to);
            var sources, destinations;

            if (sr.boundary === "in") {
                if (dr.boundary) throw new Error("Invalid boundary-to-boundary arc in " + type);
                destinations = localInputTargets(dr);
                if (!publishedInputs[sr.port]) publishedInputs[sr.port] = [];
                for (j=0; j<destinations.length; j++) publishedInputs[sr.port].push(destinations[j]);
                continue;
            }

            if (dr.boundary === "out") {
                if (sr.boundary) throw new Error("Invalid boundary-to-boundary arc in " + type);
                sources = localOutputSources(sr);
                if (!publishedOutputs[dr.port]) publishedOutputs[dr.port] = [];
                for (j=0; j<sources.length; j++) publishedOutputs[dr.port].push(sources[j]);
                continue;
            }

            if (sr.boundary || dr.boundary) {
                throw new Error("Unsupported subgraph boundary arc in " + type);
            }

            sources = localOutputSources(sr);
            destinations = localInputTargets(dr);
            connectEndpointLists(flat, sources, destinations, ga);
        }

        return {inputs:publishedInputs, outputs:publishedOutputs, direct:false};
    }

    /*
     * Return the local instance name of a node displayed in a subgraph editor.
     * Nodes created from the manifest are shown with an already-mangled visual
     * name (parent__child). Nodes newly dropped by the designer use their
     * ordinary instance name (for example arm_filter_cascade_1).
     */
    function editorLocalInstanceName(parentFullName, node) {
        var nm = make_name(node);
        var prefix = parentFullName + "__";
        var pos;
        if (nm.indexOf(prefix) === 0) return nm.substring(prefix.length);

        /* Editor nodes generated from a manifest carry only the immediate
         * parent's visual prefix. For nested subgraphs the compiler's full
         * prefix is longer, so strip the editor prefix at the last '__'. */
        if (node && (node._subgraphEditorOwner || node._subgraphEditorWorkspace)) {
            pos = nm.lastIndexOf("__");
            if (pos >= 0) return nm.substring(pos + 2);
        }
        return nm;
    }

    function editorBoundaryIndex(node, direction) {
        var text;
        var m;
        if (!node) return -1;

        text = String(node.id || "");
        m = text.match(new RegExp("__" + direction + "_([0-9]+)$"));
        if (m) return parseInt(m[1],10);

        text = make_name(node);
        m = text.match(new RegExp((direction === "in" ? "input" : "output") + "_([0-9]+)$"));
        if (m) return parseInt(m[1],10);
        return -1;
    }

    function liveSubgraphWorkspace(instance) {
        var id;
        if (!instance || instance.id == null) return null;
        id = "subgraph_" + instance.id;
        return RED.nodes.workspace(id) ? id : null;
    }

    /*
     * Expand the ACTUAL contents of an open subgraph editor workspace.
     * This is intentionally different from the original prototype, which
     * always re-read the component manifest and therefore lost any nested
     * subgraph inserted by the designer during the current editing session.
     *
     * The manifest remains the canonical starting point. Once an editor view
     * exists, however, the current workspace is the in-memory design being
     * exported. Boundary nodes are not emitted; they only define the published
     * input/output mappings.
     */
    function expandSubgraphWorkspace(flat, fullInstanceName, type, instance, workspaceId) {
        var manifest = manifestForType(type);
        var nodes = [];
        var links = [];
        var desc = {};
        var publishedInputs = {};
        var publishedOutputs = {};
        var bindingOverrides = {};
        var instanceValues;
        var i, n, l, localName, localType, childFullName, childManifest;

        if (!manifest || manifest.component_kind !== "subgraph") {
            throw new Error("Missing subgraph manifest for " + type);
        }

        instanceValues = instanceParameterValues(manifest, instance || {});
        var ppList = manifest.parameters || [];
        for (i=0; i<ppList.length; i++) {
            var pp = ppList[i];
            if (!pp.bind) continue;
            var bm = String(pp.bind).match(/^(.*)\.([^.]+)$/);
            if (!bm) continue;
            if (!bindingOverrides[bm[1]]) bindingOverrides[bm[1]] = {};
            if (instanceValues.hasOwnProperty(pp.name)) {
                bindingOverrides[bm[1]][bm[2]] = instanceValues[pp.name];
            }
        }

        RED.nodes.eachNode(function(node) {
            if (String(node.z) === String(workspaceId)) nodes.push(node);
        });
        RED.nodes.eachLink(function(link) {
            if (link.source && link.target &&
                String(link.source.z) === String(workspaceId) &&
                String(link.target.z) === String(workspaceId)) {
                links.push(link);
            }
        });

        /* Build descriptors for every component currently visible in the
         * editor. This includes a newly inserted nested subgraph. */
        for (i=0; i<nodes.length; i++) {
            n = nodes[i];

            if (isPlatformNode(n)) {
                throw new Error("A platform can only be selected in main_graph");
            }

            if (n.type === "subgraph_input") {
                desc[n.id] = {boundary:"in", port:editorBoundaryIndex(n,"in")};
                continue;
            }
            if (n.type === "subgraph_output") {
                desc[n.id] = {boundary:"out", port:editorBoundaryIndex(n,"out")};
                continue;
            }

            localName = editorLocalInstanceName(fullInstanceName,n);
            localType = n.type || baseComponentType(localName);
            childFullName = fullInstanceName + "__" + localName;
            childManifest = manifestForType(localType);

            var childProps = copyObject(n);
            if (bindingOverrides[localName]) {
                var bk;
                for (bk in bindingOverrides[localName]) {
                    if (bindingOverrides[localName].hasOwnProperty(bk)) {
                        childProps[bk] = bindingOverrides[localName][bk];
                    }
                }
            }

            if ((n.kind === "subgraph") ||
                (childManifest && childManifest.component_kind === "subgraph")) {
                var childWorkspace = liveSubgraphWorkspace(n);
                if (childWorkspace) {
                    desc[n.id] = expandSubgraphWorkspace(
                        flat, childFullName, localType, n, childWorkspace
                    );
                } else {
                    desc[n.id] = expandSubgraph(flat, childFullName, localType, n);
                }
            } else {
                flat.nodes.push({
                    kind:"node",
                    type:localType,
                    name:childFullName,
                    props:childProps
                });
                desc[n.id] = {
                    inputs:null,
                    outputs:null,
                    direct:true,
                    name:childFullName,
                    kind:"node"
                };
            }
        }

        function inputTargets(d, port) {
            if (!d) return [];
            if (d.direct) return [endpoint(d.name,d.kind,port)];
            return d.inputs[port] || [];
        }
        function outputSources(d, port) {
            if (!d) return [];
            if (d.direct) return [endpoint(d.name,d.kind,port)];
            return d.outputs[port] || [];
        }

        for (i=0; i<links.length; i++) {
            l = links[i];
            var sd = desc[l.source.id];
            var dd = desc[l.target.id];
            var sp = (l.sourcePort == null) ? 0 : l.sourcePort;
            var dp = (l.targetPort == null) ? 0 : l.targetPort;
            var sources;
            var destinations;

            if (!sd || !dd) continue;

            if (sd.boundary === "in") {
                if (dd.boundary) continue;
                destinations = inputTargets(dd,dp);
                if (!publishedInputs[sd.port]) publishedInputs[sd.port] = [];
                Array.prototype.push.apply(publishedInputs[sd.port],destinations);
                continue;
            }

            if (dd.boundary === "out") {
                if (sd.boundary) continue;
                sources = outputSources(sd,sp);
                if (!publishedOutputs[dd.port]) publishedOutputs[dd.port] = [];
                Array.prototype.push.apply(publishedOutputs[dd.port],sources);
                continue;
            }

            if (sd.boundary || dd.boundary) continue;

            sources = outputSources(sd,sp);
            destinations = inputTargets(dd,dp);
            connectEndpointLists(flat,sources,destinations,l);
        }

        return {inputs:publishedInputs, outputs:publishedOutputs, direct:false};
    }

    function expandSubgraphInstance(flat, fullInstanceName, type, instance) {
        var workspaceId = liveSubgraphWorkspace(instance);
        if (workspaceId) {
            return expandSubgraphWorkspace(flat,fullInstanceName,type,instance,workspaceId);
        }
        return expandSubgraph(flat,fullInstanceName,type,instance);
    }

    function buildFlattenedGraph(rootWorkspace) {
        var flat = {nodes:[], arcs:[]};
        var rootNodes = [];
        var rootLinks = [];
        var rootNodeById = {};
        var connected = {};
        var descriptors = {};
        var i, n, l;

        RED.nodes.eachNode(function(node) {
            if (node.z === rootWorkspace) {
                rootNodes.push(node);
                rootNodeById[node.id] = node;
            }
        });

        RED.nodes.eachLink(function(link) {
            if (link.source && link.target &&
                link.source.z === rootWorkspace && link.target.z === rootWorkspace) {
                rootLinks.push(link);
                connected[link.source.id] = true;
                connected[link.target.id] = true;
            }
        });

        /*
         * Collect the names of real subgraph instances in this top-level
         * workspace. Any node named <subgraph>__... is an expanded/editor
         * representation and must never be exported as an independent root
         * node. This also cleans stale objects created by older prototypes.
         */
        var subgraphPrefixes = [];
        for (i=0; i<rootNodes.length; i++) {
            n = rootNodes[i];
            if (n.kind === "subgraph") {
                subgraphPrefixes.push(make_name(n) + "__");
            }
        }

        function isEditorOrExpandedNode(node) {
            var nm, pi, nws;
            if (!node) return false;
            if (node._subgraphEditorOwner || node._subgraphEditorWorkspace) return true;
            if (node.type === "subgraph_input" || node.type === "subgraph_output") return true;
            nws = (node.z != null) ? RED.nodes.workspace(node.z) : null;
            if (nws && nws.subgraphOwner) return true;
            nm = make_name(node);
            for (pi=0; pi<subgraphPrefixes.length; pi++) {
                if (nm.indexOf(subgraphPrefixes[pi]) === 0) return true;
            }
            return false;
        }

        /*
         * A computing node/subgraph with no arc cannot affect the graph and is
         * not exported. This also removes stale palette/subgraph objects left
         * by an editing session. IO and zero-port control nodes are retained.
         */
        var included = {};
        for (i=0; i<rootNodes.length; i++) {
            n = rootNodes[i];
            if (isEditorOrExpandedNode(n)) continue;
            var isIO = n.kind === "IO";
            var isControl = ((n.outputs || 0) === 0 && (!n._def || (n._def.inputs || 0) === 0));
            if (connected[n.id] || isIO || isControl) included[n.id] = true;
        }

        for (i=0; i<rootNodes.length; i++) {
            n = rootNodes[i];
            if (isEditorOrExpandedNode(n)) continue;
            if (!included[n.id]) continue;

            var rootName = (n.kind === "IO") ? make_io_name(n) : make_name(n);
            if (n.kind === "subgraph") {
                descriptors[n.id] = expandSubgraphInstance(flat, rootName, n.type, n);
            } else {
                var k;
                if (isPlatformNode(n)) {
                    k = "platform";
                    rootName = platformName(n);
                } else {
                    k = (n.kind === "IO") ? "IO" : "node";
                }
                flat.nodes.push({
                    kind:k,
                    type:n.type,
                    name:rootName,
                    props:n,
                    generated:(n.generated === true || String(n.generated).toLowerCase() === "true"),
                    generated_by:n.generated_by || "",
                    generated_reason:n.generated_reason || ""
                });
                descriptors[n.id] = {
                    direct:true,
                    name:rootName,
                    kind:k,
                    inputs:null,
                    outputs:null
                };
            }
        }

        function rootOutputSources(desc, port) {
            if (!desc) return [];
            if (desc.direct) return [endpoint(desc.name,desc.kind,port)];
            return desc.outputs[port] || [];
        }
        function rootInputTargets(desc, port) {
            if (!desc) return [];
            if (desc.direct) return [endpoint(desc.name,desc.kind,port)];
            return desc.inputs[port] || [];
        }

        for (i=0; i<rootLinks.length; i++) {
            l = rootLinks[i];
            if (!included[l.source.id] || !included[l.target.id]) continue;
            connectEndpointLists(
                flat,
                rootOutputSources(descriptors[l.source.id], l.sourcePort || 0),
                rootInputTargets(descriptors[l.target.id], l.targetPort || 0),
                l
            );
        }

        /* Defensive de-duplication. The compiler IR must contain each
         * flattened node and arc once, even if a browser session contains
         * stale editor objects from an older GUI prototype. */
        var uniqueNodes = [];
        var seenNodes = {};
        for (i=0; i<flat.nodes.length; i++) {
            n = flat.nodes[i];
            var nk = n.kind + "|" + n.name;
            if (!seenNodes[nk]) {
                seenNodes[nk] = true;
                uniqueNodes.push(n);
            }
        }
        flat.nodes = uniqueNodes;

        var uniqueArcs = [];
        var seenArcs = {};
        for (i=0; i<flat.arcs.length; i++) {
            var aa = flat.arcs[i];
            var ak = aa.source.kind + "|" + aa.source.name + "|" + aa.source.port +
                     ">" + aa.destination.kind + "|" + aa.destination.name + "|" + aa.destination.port +
                     "|" + JSON.stringify(aa.attrs || {});
            if (!seenArcs[ak]) {
                seenArcs[ak] = true;
                uniqueArcs.push(aa);
            }
        }
        flat.arcs = uniqueArcs;

        return flat;
    }

    function appendManifestParametersFrom(yml, type, props) {
        var manifest = manifestForType(type);
        var fields = [];
        var i, p, value;
        if (!manifest || !manifest.parameters) return yml;
        for (i=0; i<manifest.parameters.length; i++) {
            p = manifest.parameters[i];
            value = props ? props[p.name] : null;
            if (!isEmpty(value)) fields.push({parameter:p,value:value});
        }
        if (fields.length) {
            yml += "    parameters:\n";
            for (i=0; i<fields.length; i++) {
                yml += "      " + fields[i].parameter.name + ": " +
                       yamlScalar(fields[i].value, fields[i].parameter) + "\n";
            }
        }
        return yml;
    }


    function flatNodeByName(flat, name) {
        var i;
        for (i=0; i<flat.nodes.length; i++) {
            if (flat.nodes[i].name === name) return flat.nodes[i];
        }
        return null;
    }

    function selectedPlatformManifest(flat) {
        var i, name;
        for (i=0; i<flat.nodes.length; i++) {
            if (flat.nodes[i].kind === "platform") {
                name = flat.nodes[i].name;
                return (window.NG_PLATFORM_MANIFESTS || {})[name] || null;
            }
        }
        return null;
    }

    function endpointFormat(flat, ep, direction, platformManifest) {
        var R = window.NG_FORMAT_RESOLVER;
        var n, manifest, itf, fmt, props;
        if (!R) throw new Error("format resolver is not loaded");
        if (ep.kind === "IO") {
            itf = R.findPlatformInterface(platformManifest, ep.name);
            if (!itf) throw new Error("Platform has no interface matching " + ep.name);
            fmt = copyObject(itf.format || {});

            /*
             * The platform manifest is the capability envelope, while the IO
             * properties stored in the graph are graph-level selections.
             * Merge non-empty graph selections as exact endpoint constraints.
             * Do not reject a graph selection merely because it is outside the
             * platform manifest's advertised values here: doing so would abort
             * before automatic arm_converter insertion can be attempted.
             * The platform capability remains the source of defaults/candidates
             * when the graph does not explicitly select a value.
             */
            n = flatNodeByName(flat,ep.name);
            props = n ? (n.props || {}) : {};

            function applyIoOverride(field, value) {
                fmt[field] = R.applyEndpointOverride(field,fmt[field],value,ep.name);
            }

            applyIoOverride("data_type", props.data_type);
            applyIoOverride("sample_rate", props.samprt);
            applyIoOverride("nb_channels", props.nbchan);
            applyIoOverride("interleaving", props.interleaving);
            applyIoOverride("frame_length", props.framel);

            return {format:fmt, platformInterface:itf};
        }
        n = flatNodeByName(flat,ep.name);
        if (!n) throw new Error("Cannot resolve endpoint node " + ep.name);
        manifest = manifestForType(n.type);
        if (!manifest) return {format:{}, platformInterface:null};
        itf = R.findNodeInterface(manifest,direction,ep.port);
        if (!itf) throw new Error("Manifest " + n.type + " has no " + direction + " interface index " + ep.port);
        return {
            format:itf.format || {},
            platformInterface:null,
            sameAs:(itf.format && itf.format.same_as) ? itf.format.same_as : null
        };
    }

    function endpointResolutionKey(ep, direction) {
        return ep.kind + "|" + ep.name + "|" + direction + "|" + ep.port;
    }

    function sameAsResolutionKey(ep, relation) {
        var direction;
        if (!relation) return null;
        direction = String(relation.interface || "").toLowerCase();
        if (direction === "rx_interface") direction = "rx";
        else if (direction === "tx_interface") direction = "tx";
        if ((direction !== "rx") && (direction !== "tx"))
            throw new Error("Invalid same_as.interface '" + relation.interface + "' on " + ep.name);
        if (isEmpty(relation.index))
            throw new Error("Missing same_as.index on " + ep.name);
        return ep.kind + "|" + ep.name + "|" + direction + "|" + Number(relation.index);
    }

    function concreteFormatFromAttrs(attrs) {
        attrs = attrs || {};
        return {
            dataType:attrs.dataType,
            sampleRate:attrs.sampleRate,
            nbChannels:attrs.nbChannels,
            interleaving:attrs.interleaving
        };
    }

    function exactConstraintFormat(concrete) {
        concrete = concrete || {};
        return {
            data_type:concrete.dataType,
            sample_rate:concrete.sampleRate,
            nb_channels:concrete.nbChannels,
            interleaving:concrete.interleaving
        };
    }

    function applySameAsIfReady(info, ep, resolved) {
        var key, concrete;
        if (!info.sameAs) return true;
        key = sameAsResolutionKey(ep,info.sameAs);
        concrete = resolved[key];
        if (!concrete) return false;
        info.format = exactConstraintFormat(concrete);
        return true;
    }

    function rememberEndpointFormat(resolved, ep, direction, attrs) {
        resolved[endpointResolutionKey(ep,direction)] = concreteFormatFromAttrs(attrs);
    }

    function copyArcAttrs(attrs) {
        return arcAttributes(attrs || {});
    }

    function nextGeneratedNodeName(flat, type) {
        var i, n, prefix, index, maxIndex;
        prefix = type + "_";
        maxIndex = -1;
        for (i=0; i<flat.nodes.length; i++) {
            n = flat.nodes[i];
            if (n.kind !== "node") continue;
            if (n.name.indexOf(prefix) !== 0) continue;
            index = parseInt(n.name.substring(prefix.length),10);
            if (!isNaN(index) && String(index) === n.name.substring(prefix.length) && index > maxIndex)
                maxIndex = index;
        }
        return type + "_" + (maxIndex + 1);
    }

    function preferredEndpointValue(R, raw, platformDefault) {
        var c = R.normalizeConstraint(raw);
        if (c.exact && c.values.length) return c.values[0];
        if (!isEmpty(platformDefault) && R.contains(c,platformDefault)) return platformDefault;
        if (!isEmpty(c.defaultValue)) return c.defaultValue;
        if (c.values.length) return c.values[0];
        return null;
    }

    function compatibleOrNull(R, field, producerRaw, consumerRaw, options) {
        try {
            return {compatible:true, value:R.choose(field,producerRaw,consumerRaw,options || {})};
        } catch (err) {
            return {compatible:false, error:err};
        }
    }

    function resolveSideValue(R, raw, otherRaw, platformDefault) {
        var v = preferredEndpointValue(R,raw,platformDefault);
        if (!isEmpty(v)) return v;
        /* An unconstrained endpoint inherits the concrete value of the other side. */
        v = preferredEndpointValue(R,otherRaw,null);
        return v;
    }

    function insertConverterForArc(flat, arcIndex, a, src, dst, platformDefaults, dataResult, rateResult, channelsResult, interleavingResult) {
        var R = window.NG_FORMAT_RESOLVER;
        var converterName = nextGeneratedNodeName(flat,"arm_converter");
        var converterManifest = manifestForType("arm_converter");
        var props = {};
        var inType, outType, inRate, outRate, inChannels, outChannels, inInterleaving, outInterleaving;
        var firstAttrs, secondAttrs;
        if (!converterManifest) throw new Error("No arm_converter manifest is available for automatic format conversion");

        if (dataResult && dataResult.compatible) {
            inType = dataResult.value;
            outType = dataResult.value;
        } else {
            inType = resolveSideValue(R,src.format.data_type,dst.format.data_type,platformDefaults.srcDataType);
            outType = resolveSideValue(R,dst.format.data_type,src.format.data_type,platformDefaults.dstDataType);
        }
        if (rateResult && rateResult.compatible) {
            inRate = rateResult.value;
            outRate = rateResult.value;
        } else {
            inRate = resolveSideValue(R,src.format.sample_rate,dst.format.sample_rate,platformDefaults.srcSampleRate);
            outRate = resolveSideValue(R,dst.format.sample_rate,src.format.sample_rate,platformDefaults.dstSampleRate);
        }

        if (channelsResult && channelsResult.compatible) {
            inChannels = channelsResult.value;
            outChannels = channelsResult.value;
        } else {
            inChannels = resolveSideValue(R,src.format.nb_channels,dst.format.nb_channels,platformDefaults.srcNbChannels);
            outChannels = resolveSideValue(R,dst.format.nb_channels,src.format.nb_channels,platformDefaults.dstNbChannels);
        }
        if (interleavingResult && interleavingResult.compatible) {
            inInterleaving = interleavingResult.value;
            outInterleaving = interleavingResult.value;
        } else {
            inInterleaving = resolveSideValue(R,src.format.interleaving,dst.format.interleaving,platformDefaults.srcInterleaving);
            outInterleaving = resolveSideValue(R,dst.format.interleaving,src.format.interleaving,platformDefaults.dstInterleaving);
        }

        if (!isEmpty(inType)) props.i_data_type = inType;
        if (!isEmpty(outType)) props.o_data_type = outType;
        if (!isEmpty(inRate)) props.i_sample_rate = inRate;
        if (!isEmpty(outRate)) props.o_sample_rate = outRate;
        if (!isEmpty(inChannels)) props.i_nb_channels = inChannels;
        if (!isEmpty(outChannels)) props.o_nb_channels = outChannels;
        if (!isEmpty(inInterleaving)) props.i_interleaving = inInterleaving;
        if (!isEmpty(outInterleaving)) props.o_interleaving = outInterleaving;

        /*
         * Frame length is NOT negotiated.  The converter input processing
         * granularity follows the producer; its output granularity follows the
         * consumer.  Missing endpoint information remains missing rather than
         * becoming a compatibility constraint.
         */
        props.i_frame_length = R.frameLengthValue(src.format.frame_length);
        props.o_frame_length = R.frameLengthValue(dst.format.frame_length);

        var generatedReasons = [];
        if (dataResult && !dataResult.compatible) generatedReasons.push("data_type");
        if (rateResult && !rateResult.compatible) generatedReasons.push("sample_rate");
        if (channelsResult && !channelsResult.compatible) generatedReasons.push("nb_channels");
        if (interleavingResult && !interleavingResult.compatible) generatedReasons.push("interleaving");
        flat.nodes.push({
            kind:"node",
            type:"arm_converter",
            name:converterName,
            props:props,
            generated:true,
            generated_by:"format_resolver",
            generated_reason:generatedReasons.join(",")
        });

        firstAttrs = copyArcAttrs(a.attrs);
        secondAttrs = copyArcAttrs(a.attrs);
        /* arc_name and overlay describe the original FIFO and cannot safely name two generated FIFOs. */
        secondAttrs.arcName = "";
        secondAttrs.overlayWith = "";

        firstAttrs.dataType = inType;
        firstAttrs.sampleRate = inRate;
        firstAttrs.nbChannels = inChannels;
        firstAttrs.interleaving = inInterleaving;
        secondAttrs.dataType = outType;
        secondAttrs.sampleRate = outRate;
        secondAttrs.nbChannels = outChannels;
        secondAttrs.interleaving = outInterleaving;

        return [
            {source:a.source, destination:endpoint(converterName,"node",0), attrs:firstAttrs},
            {source:endpoint(converterName,"node",0), destination:a.destination, attrs:secondAttrs}
        ];
    }

    function resolveArcFormats(flat) {
        var R = window.NG_FORMAT_RESOLVER;
        var platformManifest = selectedPlatformManifest(flat);
        var pending, nextPending, newArcs=[];
        var resolved={};
        var i, a, src, dst, requested, dataResult, rateResult, channelsResult, interleavingResult;
        var defs, splitArcs, progress, pass;
        if (!R) throw new Error("format resolver is not loaded");
        if (!platformManifest) throw new Error("Graph has no platform");

        /*
         * Resolve in passes because same_as may make a TX interface depend on an
         * RX interface whose incoming arc appears later in the editor arc list.
         * A resolved endpoint is recorded using (object,direction,port).
         */
        pending = flat.arcs.slice(0);
        pass = 0;
        while (pending.length) {
            ++pass;
            progress = false;
            nextPending = [];

            for (i=0; i<pending.length; i++) {
                a = pending[i];
                src = endpointFormat(flat,a.source,"tx",platformManifest);
                dst = endpointFormat(flat,a.destination,"rx",platformManifest);

                if (!applySameAsIfReady(src,a.source,resolved) ||
                    !applySameAsIfReady(dst,a.destination,resolved)) {
                    nextPending.push(a);
                    continue;
                }

                defs = {
                    srcDataType: src.platformInterface && src.platformInterface.format && src.platformInterface.format.data_type ? src.platformInterface.format.data_type.default : null,
                    dstDataType: dst.platformInterface && dst.platformInterface.format && dst.platformInterface.format.data_type ? dst.platformInterface.format.data_type.default : null,
                    srcSampleRate: src.platformInterface && src.platformInterface.format && src.platformInterface.format.sample_rate ? src.platformInterface.format.sample_rate.default : null,
                    dstSampleRate: dst.platformInterface && dst.platformInterface.format && dst.platformInterface.format.sample_rate ? dst.platformInterface.format.sample_rate.default : null,
                    srcNbChannels: src.platformInterface && src.platformInterface.format && src.platformInterface.format.nb_channels ? src.platformInterface.format.nb_channels.default : null,
                    dstNbChannels: dst.platformInterface && dst.platformInterface.format && dst.platformInterface.format.nb_channels ? dst.platformInterface.format.nb_channels.default : null,
                    srcInterleaving: src.platformInterface && src.platformInterface.format && src.platformInterface.format.interleaving ? (src.platformInterface.format.interleaving.default || src.platformInterface.format.interleaving) : null,
                    dstInterleaving: dst.platformInterface && dst.platformInterface.format && dst.platformInterface.format.interleaving ? (dst.platformInterface.format.interleaving.default || dst.platformInterface.format.interleaving) : null
                };

                requested = a.attrs.dataType;
                dataResult = compatibleOrNull(R,"data_type",src.format.data_type,dst.format.data_type,
                                              {requested:requested,platformDefault:!isEmpty(defs.srcDataType)?defs.srcDataType:defs.dstDataType});
                requested = a.attrs.sampleRate;
                rateResult = compatibleOrNull(R,"sample_rate",src.format.sample_rate,dst.format.sample_rate,
                                              {requested:requested,platformDefault:!isEmpty(defs.srcSampleRate)?defs.srcSampleRate:defs.dstSampleRate});
                requested = a.attrs.nbChannels;
                channelsResult = compatibleOrNull(R,"nb_channels",src.format.nb_channels,dst.format.nb_channels,
                                                  {requested:requested,platformDefault:!isEmpty(defs.srcNbChannels)?defs.srcNbChannels:defs.dstNbChannels});
                requested = a.attrs.interleaving;
                try {
                    interleavingResult = {
                        compatible:true,
                        value:R.chooseInterleaving(src.format.interleaving,
                                                   dst.format.interleaving,
                                                   channelsResult.compatible ? channelsResult.value : null,
                                                   channelsResult.compatible ? channelsResult.value : null,
                                                   {requested:requested,
                                                    platformDefault:!isEmpty(defs.srcInterleaving)?defs.srcInterleaving:defs.dstInterleaving})
                    };
                } catch (errInterleaving) {
                    interleavingResult = {compatible:false,error:errInterleaving};
                }

                if (dataResult.compatible && rateResult.compatible && channelsResult.compatible && interleavingResult.compatible) {
                    a.attrs.dataType = dataResult.value;
                    a.attrs.sampleRate = rateResult.value;
                    a.attrs.nbChannels = channelsResult.value;
                    a.attrs.interleaving = R.canonicalInterleaving(interleavingResult.value, channelsResult.value);
                    newArcs.push(a);
                    rememberEndpointFormat(resolved,a.source,"tx",a.attrs);
                    rememberEndpointFormat(resolved,a.destination,"rx",a.attrs);
                } else {
                    splitArcs = insertConverterForArc(flat,i,a,src,dst,defs,dataResult,rateResult,channelsResult,interleavingResult);
                    Array.prototype.push.apply(newArcs,splitArcs);
                    rememberEndpointFormat(resolved,a.source,"tx",splitArcs[0].attrs);
                    rememberEndpointFormat(resolved,splitArcs[0].destination,"rx",splitArcs[0].attrs);
                    rememberEndpointFormat(resolved,splitArcs[1].source,"tx",splitArcs[1].attrs);
                    rememberEndpointFormat(resolved,a.destination,"rx",splitArcs[1].attrs);
                }
                progress = true;
            }

            if (nextPending.length && !progress) {
                throw new Error("Cannot resolve format same_as relationship (missing or circular interface dependency)");
            }
            pending = nextPending;
        }

        flat.arcs = newArcs;
        return flat;
    }

    function endpointFrameLength(flat, ep, direction, platformManifest) {
        var R=window.NG_FORMAT_RESOLVER;
        var n, manifest, itf, raw, props;
        if (!R) throw new Error("format resolver is not loaded");

        if (ep.kind === "IO") {
            itf=R.findPlatformInterface(platformManifest,ep.name);
            if (!itf) throw new Error("Platform has no interface matching " + ep.name);
            raw=itf.format ? itf.format.frame_length : null;
            n=flatNodeByName(flat,ep.name);
            props=n ? (n.props || {}) : {};
            if (!isEmpty(props.framel)) raw=props.framel;
            return R.frameLengthValue(raw);
        }

        n=flatNodeByName(flat,ep.name);
        if (!n) throw new Error("Cannot resolve endpoint node " + ep.name);

        /* Generated converter frame lengths are concrete compiler parameters. */
        if (n.type === "arm_converter" && n.generated) {
            props=n.props || {};
            raw=(direction === "tx") ? props.o_frame_length : props.i_frame_length;
            return R.frameLengthValue(raw);
        }

        manifest=manifestForType(n.type);
        if (!manifest) return null;
        itf=R.findNodeInterface(manifest,direction,ep.port);
        if (!itf) return null;
        raw=itf.format ? itf.format.frame_length : null;
        return R.frameLengthValue(raw);
    }

    function sizeArcFifos(flat) {
        var R=window.NG_FORMAT_RESOLVER;
        var platformManifest=selectedPlatformManifest(flat);
        var i, a, producerLength, consumerLength, fifoSize;
        if (!R || !platformManifest) return flat;
        for (i=0; i<flat.arcs.length; i++) {
            a=flat.arcs[i];
            producerLength=endpointFrameLength(flat,a.source,"tx",platformManifest);
            consumerLength=endpointFrameLength(flat,a.destination,"rx",platformManifest);
            fifoSize=R.fifoSizeFromFrameLengths(producerLength,consumerLength);
            if (fifoSize !== null) a.attrs.bufferSize=String(fifoSize);
        }
        return flat;
    }

    function buildCommonFormats(flat) {
        var R = window.NG_FORMAT_RESOLVER;
        if (!R || !R.buildFormatTable) throw new Error("format table builder is not loaded");
        flat.formats = R.buildFormatTable(flat.arcs);
        return flat;
    }

    function renderFormatYaml(yml, f) {
        yml += "  - format:\n";
        yml += "      formatID: " + f.formatID + "\n";
        yml += "      interleaving:\n";
        yml += "        type: enum\n";
        if (!isEmpty(f.interleaving)) yml += "        default: " + f.interleaving + "\n";
        yml += "        values: [interleaved, deinterleaved]\n";
        yml += "      data_type:\n";
        if (!isEmpty(f.dataType)) yml += "        default: " + f.dataType + "\n";
        yml += "        values: [int8, int16, int32, int64, uint8, uint16, uint32, uint64, float32, float64, utf8, utf16]\n";
        yml += "      sample_rate:\n";
        yml += "        type: float\n";
        if (!isEmpty(f.sampleRate)) yml += "        default: " + f.sampleRate + "\n";
        yml += "      nb_channels:\n";
        yml += "        type: int\n";
        if (!isEmpty(f.nbChannels)) yml += "        default: " + f.nbChannels + "\n";
        return yml;
    }

    function renderFlattenedYaml(flat) {
        var yml = "";
        var i, n, a, props;
        yml += "# AUTOMATICALLY GENERATED ! " + (new Date()).toDateString() + "\n";
        yml += "# Subgraphs are flattened; internal names use '__' mangling.\n\n";
        yml += "graph_format_version: 1\n";
        yml += "graph_state: resolved\n";

        /* The platform is graph-level metadata, not a processing node. */
        for (i=0; i<flat.nodes.length; i++) {
            n = flat.nodes[i];
            if (n.kind === "platform") {
                yml += "platform: " + n.name + "\n\n";
                break;
            }
        }

        yml += "nodes:\n";

        for (i=0; i<flat.nodes.length; i++) {
            n = flat.nodes[i];
            props = n.props || {};
            if (n.kind === "platform") {
                continue;
            } else if (n.kind === "IO") {
                yml += "  - IO:   " + n.name + "\n";
                var ioFields = ["framel","period","per_hr","per_day","domain","nbchan",
                                "samprt","samprt_percent_accuracy","unit","scale","data_type",
                                "time_stamp","interleaving","paramFile","paramtxt"];
                for (var j=0; j<ioFields.length; j++) yml = appendField(yml,props,ioFields[j]);
            } else {
                yml += "  - node: " + n.name + "\n";
                if (n.generated) {
                    yml += "    generated: true\n";
                    if (!isEmpty(n.generated_by)) yml += "    generated_by: " + n.generated_by + "\n";
                    if (!isEmpty(n.generated_reason)) yml += "    generated_reason: " + n.generated_reason + "\n";
                }
                var m = manifestForType(n.type);
                if (m && m.parameters && m.parameters.length) {
                    yml = appendField(yml,props,"preset");
                    /*
                     * paramFile names an external parameter file and is exported
                     * independently of the structured parameters: block.
                     */
                    yml = appendField(yml,props,"paramFile");
                    yml = appendField(yml,props,"paramtxt");
                    yml = appendField(yml,props,"minopp");
                    yml = appendField(yml,props,"script");
                    yml = appendManifestParametersFrom(yml,n.type,props);
                } else {
                    yml = appendField(yml,props,"preset");
                    yml = appendField(yml,props,"paramFile");
                    yml = appendField(yml,props,"paramtxt");
                    yml = appendField(yml,props,"minopp");
                    yml = appendField(yml,props,"script");
                    yml = appendField(yml,props,"formatID");
                }
            }
        }

        yml += "\narcs:\n";
        for (i=0; i<flat.arcs.length; i++) {
            a = flat.arcs[i];
            yml += "  - OPort_" + a.source.port + " " + a.source.kind + ": " + a.source.name + "\n";
            yml += "    IPort_" + a.destination.port + " " + a.destination.kind + ": " + a.destination.name + "\n";
            if (!isEmpty(a.attrs.arcName)) yml += "    arc_name: " + a.attrs.arcName + "\n";
            if (!isEmpty(a.attrs.bufferSize)) yml += "    buffer_size: " + a.attrs.bufferSize + "\n";
            if (!isEmpty(a.attrs.refresh)) yml += "    refresh: " + a.attrs.refresh + "\n";
            if (!isEmpty(a.attrs.jitterPercent)) yml += "    jitter_percent: " + a.attrs.jitterPercent + "\n";
            if (!isEmpty(a.attrs.overlayWith)) yml += "    overlay_with: " + a.attrs.overlayWith + "\n";
            if (!isEmpty(a.attrs.formatID)) yml += "    formatID: " + a.attrs.formatID + "\n";
            if (!isEmpty(a.attrs.script)) yml += "    script: " + a.attrs.script + "\n";
        }

        yml += "\nformats:\n";
        for (i=0; i<(flat.formats || []).length; i++) {
            yml = renderFormatYaml(yml,flat.formats[i]);
        }

        return yml;
    }


    /* ------------------------------------------------------------------
     * Graph YAML import
     * ------------------------------------------------------------------
     * This parser deliberately accepts the YAML subset emitted by
     * renderFlattenedYaml(). It is not intended to be a general YAML parser.
     * A manually edited arm_converter is treated as a normal design node unless
     * it explicitly carries `generated: true`.
     */
    function parseGraphScalar(text) {
        var t = $.trim(String(text == null ? "" : text));
        if (t.length >= 2 && t.charAt(0) === '"' && t.charAt(t.length-1) === '"') {
            try { return JSON.parse(t); } catch (ignore) { return t.substring(1,t.length-1); }
        }
        if (t === "true") return true;
        if (t === "false") return false;
        if (t === "null") return null;
        if (/^-?[0-9]+$/.test(t)) return parseInt(t,10);
        if (/^-?(?:[0-9]+\.[0-9]*|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(t) ||
            /^-?[0-9]+[eE][+-]?[0-9]+$/.test(t)) return parseFloat(t);
        return t;
    }

    function parseExportedGraphYaml(text) {
        var lines = String(text || "").replace(/\r/g,"").split("\n");
        var model = {graph_format_version:null, graph_state:"", platform:"", nodes:[], arcs:[]};
        var section = "", currentNode = null, currentArc = null, inParameters = false;
        var i, line, m, key, value;

        for (i=0; i<lines.length; i++) {
            line = lines[i];
            if (!line || /^\s*#/.test(line)) continue;

            if (/^graph_format_version\s*:/.test(line)) {
                model.graph_format_version = parseGraphScalar(line.substring(line.indexOf(":")+1));
                continue;
            }
            if (/^graph_state\s*:/.test(line)) {
                model.graph_state = String(parseGraphScalar(line.substring(line.indexOf(":")+1)));
                continue;
            }
            if (/^platform\s*:/.test(line)) {
                model.platform = $.trim(line.substring(line.indexOf(":")+1));
                continue;
            }
            if (/^nodes\s*:/.test(line)) { section="nodes"; currentNode=null; currentArc=null; continue; }
            if (/^arcs\s*:/.test(line)) { section="arcs"; currentNode=null; currentArc=null; continue; }
            if (/^formats\s*:/.test(line)) { section="formats"; currentNode=null; currentArc=null; continue; }

            if (section === "nodes") {
                m = line.match(/^\s{2}-\s+(IO|node)\s*:\s*(.+?)\s*$/);
                if (m) {
                    currentNode = {kind:m[1], name:$.trim(m[2]), props:{}, parameters:{}, generated:false};
                    model.nodes.push(currentNode);
                    inParameters = false;
                    continue;
                }
                if (!currentNode) continue;
                if (/^\s{4}parameters\s*:\s*$/.test(line)) { inParameters=true; continue; }
                if (inParameters) {
                    m = line.match(/^\s{6}([^:]+)\s*:\s*(.*)$/);
                    if (m) {
                        currentNode.parameters[$.trim(m[1])] = parseGraphScalar(m[2]);
                        continue;
                    }
                    inParameters=false;
                }
                m = line.match(/^\s{4}([^:]+)\s*:\s*(.*)$/);
                if (m) {
                    key=$.trim(m[1]); value=parseGraphScalar(m[2]);
                    if (key === "generated") currentNode.generated=(value === true || String(value).toLowerCase() === "true");
                    else if (key === "generated_by") currentNode.generated_by=String(value);
                    else if (key === "generated_reason") currentNode.generated_reason=String(value);
                    else currentNode.props[key]=value;
                }
                continue;
            }

            if (section === "arcs") {
                m = line.match(/^\s{2}-\s+OPort_([0-9]+)\s+(IO|node)\s*:\s*(.+?)\s*$/);
                if (m) {
                    currentArc={
                        source:{port:parseInt(m[1],10),kind:m[2],name:$.trim(m[3])},
                        destination:null,
                        attrs:{}
                    };
                    model.arcs.push(currentArc);
                    continue;
                }
                if (!currentArc) continue;
                m = line.match(/^\s{4}IPort_([0-9]+)\s+(IO|node)\s*:\s*(.+?)\s*$/);
                if (m) {
                    currentArc.destination={port:parseInt(m[1],10),kind:m[2],name:$.trim(m[3])};
                    continue;
                }
                m = line.match(/^\s{4}([^:]+)\s*:\s*(.*)$/);
                if (m) currentArc.attrs[$.trim(m[1])] = parseGraphScalar(m[2]);
            }
        }
        return model;
    }

    function inferImportedNodeType(node) {
        var name = String(node.name || "");
        var manifests, types, i, type;
        if (node.kind === "IO") return name.replace(/\[[0-9]+\]$/,"");
        manifests = window.NG_NODE_MANIFESTS || {};
        types = Object.keys(manifests).sort(function(a,b){ return b.length-a.length; });
        for (i=0; i<types.length; i++) {
            type=types[i];
            if (name === type || name.indexOf(type+"_") === 0 || name.indexOf(type+"[") === 0) return type;
        }
        return name.replace(/_[0-9]+$/,"");
    }

    function editorNameFromExported(name, kind) {
        if (kind === "IO") return name;
        return String(name).replace(/_([0-9]+)$/,"[$1]");
    }

    function mergeLogicalArcAttrs(a,b) {
        var out={}, keys=["arc_name","buffer_size","refresh","jitter_percent","overlay_with","script"], i, k;
        a=a||{}; b=b||{};
        for (i=0;i<keys.length;i++) {
            k=keys[i];
            if (!isEmpty(a[k])) out[k]=a[k];
            else if (!isEmpty(b[k])) out[k]=b[k];
        }
        /* formatID belongs to a resolved graph and is intentionally discarded. */
        return out;
    }

    function collapseGeneratedNodes(model) {
        var generated={}, i, n, incoming, outgoing, newArcs=[], consumed={};
        for (i=0;i<model.nodes.length;i++) if (model.nodes[i].generated) generated[model.nodes[i].name]=model.nodes[i];
        Object.keys(generated).forEach(function(name){
            incoming=[]; outgoing=[];
            for (var j=0;j<model.arcs.length;j++) {
                var a=model.arcs[j];
                if (a.destination && a.destination.name === name) incoming.push({arc:a,index:j});
                if (a.source && a.source.name === name) outgoing.push({arc:a,index:j});
            }
            if (incoming.length !== 1 || outgoing.length !== 1) {
                throw new Error("Generated node " + name + " cannot be collapsed: expected exactly one input and one output arc");
            }
            consumed[incoming[0].index]=true; consumed[outgoing[0].index]=true;
            newArcs.push({
                source:incoming[0].arc.source,
                destination:outgoing[0].arc.destination,
                attrs:mergeLogicalArcAttrs(incoming[0].arc.attrs,outgoing[0].arc.attrs)
            });
        });
        for (i=0;i<model.arcs.length;i++) if (!consumed[i]) newArcs.push(model.arcs[i]);
        model.arcs=newArcs;
        model.nodes=model.nodes.filter(function(x){ return !x.generated; });
        model.graph_state="logical";
        return model;
    }

    function importedWireAttrs(attrs) {
        attrs=attrs||{};
        return {
            bufferSize:isEmpty(attrs.buffer_size)?"":String(attrs.buffer_size),
            arcName:isEmpty(attrs.arc_name)?"":String(attrs.arc_name),
            refresh:isEmpty(attrs.refresh)?"":String(attrs.refresh),
            jitterPercent:isEmpty(attrs.jitter_percent)?"":String(attrs.jitter_percent),
            overlayWith:isEmpty(attrs.overlay_with)?"":String(attrs.overlay_with),
            formatID:isEmpty(attrs.formatID)?"":String(attrs.formatID),
            script:isEmpty(attrs.script)?"":String(attrs.script)
        };
    }

    function graphModelToNodeRed(model) {
        var records=[], byName={}, x=140, y=100, row=0, i, n, type, def, rec, a, src, wire, p;

        if (model.platform) {
            def=RED.nodes.getType(model.platform);
            if (!def) throw new Error("Unknown platform type '" + model.platform + "'");
            rec={id:RED.nodes.id(), type:model.platform, name:model.platform, x:120, y:60, wires:[]};
            records.push(rec); byName[model.platform]=rec;
        }

        for (i=0;i<model.nodes.length;i++) {
            n=model.nodes[i]; type=inferImportedNodeType(n); def=RED.nodes.getType(type);
            if (!def) throw new Error("Unknown node type '" + type + "' for " + n.name);
            rec={
                id:RED.nodes.id(),
                type:type,
                name:editorNameFromExported(n.name,n.kind),
                x:x + (row%4)*190,
                y:150 + Math.floor(row/4)*100,
                wires:[]
            };
            row++;
            for (p in n.props) if (n.props.hasOwnProperty(p)) rec[p]=n.props[p];
            for (p in n.parameters) if (n.parameters.hasOwnProperty(p)) rec[p]=n.parameters[p];
            if (n.generated) {
                rec.generated=true;
                rec.generated_by=n.generated_by || "";
                rec.generated_reason=n.generated_reason || "";
            }
            for (var w=0; w<(def.outputs||0); w++) rec.wires.push([]);
            records.push(rec); byName[n.name]=rec;
        }

        for (i=0;i<model.arcs.length;i++) {
            a=model.arcs[i];
            if (!a.destination) throw new Error("Arc from " + a.source.name + " has no destination");
            src=byName[a.source.name];
            var dst=byName[a.destination.name];
            if (!src) throw new Error("Arc source not found: " + a.source.name);
            if (!dst) throw new Error("Arc destination not found: " + a.destination.name);
            while (src.wires.length <= a.source.port) src.wires.push([]);
            wire=importedWireAttrs(a.attrs);
            wire.target=dst.id;
            wire.targetPort=a.destination.port;
            src.wires[a.source.port].push(wire);
        }
        return records;
    }

    function replaceCurrentWorkspaceWith(records) {
        var workspace=RED.view.getWorkspace(), removeIds=[];
        RED.nodes.eachNode(function(n){ if (String(n.z) === String(workspace)) removeIds.push(n.id); });
        for (var i=0;i<removeIds.length;i++) RED.nodes.remove(removeIds[i]);
        for (i=0;i<records.length;i++) records[i].z=workspace;
        var result=RED.nodes.import(records,false);
        if (!result) throw new Error("Node-RED rejected imported graph");
        RED.view.redraw();
        RED.view.dirty(true);
        return result;
    }

    function importGraphYaml(text, preserveGenerated) {
        var model=parseExportedGraphYaml(text);
        if (model.graph_format_version != null && Number(model.graph_format_version) !== 1)
            throw new Error("Unsupported graph_format_version " + model.graph_format_version);
        if (!model.platform) throw new Error("Imported graph has no platform");
        if (!preserveGenerated) collapseGeneratedNodes(model);
        var records=graphModelToNodeRed(model);
        replaceCurrentWorkspaceWith(records);
        RED.notify("Graph imported: " + model.nodes.length + " nodes, " + model.arcs.length + " arcs" +
                   (preserveGenerated ? " (generated nodes preserved)" : " (generated nodes will be regenerated on export)"),"success");
    }

    function showImportGraphDialog() {
        RED.view.getForm('dialog-form','graph-import-dialog',function(){
            $("#node-input-graph-import").val("");
            $("#graph-import-logical").prop("checked",true);
            $("#node-input-graph-file").off("change.nggraph").on("change.nggraph",function(evt){
                var file=evt.target.files && evt.target.files[0];
                if (!file) return;
                var reader=new FileReader();
                reader.onload=function(e){ $("#node-input-graph-import").val(e.target.result || ""); };
                reader.onerror=function(){ RED.notify("Unable to read graph file","error"); };
                reader.readAsText(file);
            });
            $("#dialog").dialog("option",{
                title:"Import NanoGraph YAML",
                width:700,
                buttons:[
                    {
                        text:"Import",
                        click:function(){
                            try {
                                var preserve=$("#graph-import-preserve").prop("checked");
                                importGraphYaml($("#node-input-graph-import").val(),preserve);
                                $(this).dialog("close");
                            } catch(err) {
                                RED.notify("<strong>Import error</strong>: " + err.message,"error");
                            }
                        }
                    },
                    {text:"Cancel",click:function(){ $(this).dialog("close"); }}
                ]
            }).dialog("open");
        });
    }

    $('#btn-import-graph').click(function(){ showImportGraphDialog(); });

    function save(force) {
        RED.storage.update();

        try {
            var exportWorkspace = exportRootWorkspaceId();
            var flat = buildFlattenedGraph(exportWorkspace);
            resolveArcFormats(flat);
            sizeArcFifos(flat);
            buildCommonFormats(flat);
            var hasIO = false;
            var platformCount = 0;
            var i;
            for (i=0; i<flat.nodes.length; i++) {
                if (flat.nodes[i].kind === "IO") hasIO = true;
                if (flat.nodes[i].kind === "platform") platformCount++;
            }
            if (!hasIO) throw new Error("The graph has no input/output node");
            if (platformCount > 1) {
                throw new Error("Only one platform can be selected for a graph");
            }

            var yml = renderFlattenedYaml(flat);

            RED.view.state(RED.state.EXPORT);
            RED.view.getForm('dialog-form', 'export-clipboard-dialog', function (d, f) {
                $("#node-input-export").val(yml).focus(function() {
                    var textarea = $(this);
                    textarea.select();
                    textarea.mouseup(function() {
                        textarea.unbind("mouseup");
                        return false;
                    });
                }).focus();
                $("#dialog").dialog("option","title","Export Flattened Graph").dialog("open");
            });
        } catch (err) {
            RED.notify("<strong>Export error</strong>: " + err.message,"error");
        }
    }

    $('#btn-deploy').click(function() { save(); });


    $( "#node-dialog-confirm-deploy" ).dialog({
            title: "Confirm deploy",
            modal: true,
            autoOpen: false,
            width: 530,
            height: 230,
            buttons: [
                {
                    text: "Confirm deploy",
                    click: function() {
                        save(true);
                        $( this ).dialog( "close" );
                    }
                },
                {
                    text: "Cancel",
                    click: function() {
                        $( this ).dialog( "close" );
                    }
                }
            ]
    });

    // from http://css-tricks.com/snippets/javascript/get-url-variables/
    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
        }
        return(false);
    }

    function loadNodes() {
        $(".palette-scroll").show();
        $("#palette-search").show();

        /* Create a real root workspace before loading persisted nodes.
         * Old graphs used implicit workspace 0; RED.nodes.import() will map
         * such nodes to the active main_graph workspace automatically. */
        RED.view.ensureMainWorkspace();
        RED.storage.load();
        RED.view.redraw();
        setTimeout(function() {
            $("#btn-deploy").removeClass("disabled").addClass("btn-danger");
            $("#btn-import").removeClass("disabled").addClass("btn-success");
        }, 1500);
        var info = getQueryVariable("info");
        if (info) {
            RED.sidebar.info.setHelpContent('', info);
        }
    }

    $('#btn-node-status').click(function() {toggleStatus();});

    var statusEnabled = false;
    function toggleStatus() {
        var btnStatus = $("#btn-node-status");
        statusEnabled = btnStatus.toggleClass("active").hasClass("active");
        RED.view.status(statusEnabled);
    }

    function showHelp() {

        var dialog = $('#node-help');

        dialog.on('show',function() {
            RED.keyboard.disable();
        });
        dialog.on('hidden',function() {
            RED.keyboard.enable();
        });

        dialog.modal();
    }


    function registerManifestComponents() {
        var manifests = window.NG_NODE_MANIFESTS || {};

        /* Internal boundary nodes are deliberately hidden from the palette. */
        if (!RED.nodes.getType("subgraph_input")) {
            RED.nodes.registerType("subgraph_input", {
                defaults:{name:{value:"input"},kind:{value:"subgraph-boundary"}},
                shortName:"subgraph input", inputs:0, outputs:1,
                category:"deprecated", color:"#d9edf7", icon:"arrow-in.png"
            });
        }
        if (!RED.nodes.getType("subgraph_output")) {
            RED.nodes.registerType("subgraph_output", {
                defaults:{name:{value:"output"},kind:{value:"subgraph-boundary"}},
                shortName:"subgraph output", inputs:1, outputs:0,
                category:"deprecated", color:"#dff0d8", icon:"arrow-in.png"
            });
        }

        $.each(manifests, function(type, manifest) {
            if (manifest.component_kind !== "subgraph" || RED.nodes.getType(type)) {
                return;
            }

            var inputs = (manifest.ports && manifest.ports.inputs) ? manifest.ports.inputs.length : 0;
            var outputs = (manifest.ports && manifest.ports.outputs) ? manifest.ports.outputs.length : 0;

            /* getForm() expects a template. The generic editor fills all defaults. */
            if ($("script[data-template-name='"+type+"']").length === 0) {
                $("body").append(
                    '<script type="text/x-red" data-template-name="'+type+'"></'+'script>'
                );
            }
            if ($("script[data-help-name='"+type+"']").length === 0) {
                var help = manifest.description || "Reusable subgraph";
                $("body").append(
                    '<script type="text/x-red" data-help-name="'+type+'">' +
                    '<div><p>'+help+'</p><p><b>Double-click</b> the box to open its internal graph.</p></div>' +
                    '</'+'script>'
                );
            }

            RED.nodes.registerType(type, {
                defaults:{
                    name:{value:"new"},
                    kind:{value:"subgraph", required:true},
                    definition:{value:type, required:true}
                },
                shortName:type,
                inputs:inputs,
                outputs:outputs,
                category:"subgraph",
                color:"#e8ddff",
                icon:"function.png",
                subgraph:true
            });
        });
    }

    $(function() {
        $(".palette-spinner").show();

        var patt = new RegExp(/^[http|https]/);
        var server = false && patt.test(location.protocol);

        if (!server) {
            var metaData = $.parseJSON($("script[data-container-name|='InputOutputCompatibilityMetadata']").html());
            requirements = metaData["requirements"];

            var data = $.parseJSON($("script[data-container-name|='NodeDefinitions']").html());
            var nodes = data["nodes"];
            $.each(nodes, function (key, val) {
                RED.nodes.registerType(val["type"], val["data"]);
            });
            registerManifestComponents();
            RED.keyboard.add(/* ? */ 191, {shift: true}, function () {
                showHelp();
                d3.event.preventDefault();
            });
            loadNodes();
            $(".palette-spinner").hide();
        } else {
            $.ajaxSetup({beforeSend: function(xhr){
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("application/json");
                }
            }});
            $.getJSON( "resources/nodes_def.json", function( data ) {
                var nodes = data["nodes"];
                $.each(nodes, function(key, val) {
                    RED.nodes.registerType(val["type"], val["data"]);
                });
                RED.keyboard.add(/* ? */ 191,{shift:true},function(){showHelp();d3.event.preventDefault();});
                loadNodes();
                $(".palette-spinner").hide();
            })
        }
    });

    return {
    };
})();
