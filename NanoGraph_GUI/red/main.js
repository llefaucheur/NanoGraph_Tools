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
            refresh: obj.refresh || "",
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

            var rootName = make_name(n);
            if (n.kind === "subgraph") {
                descriptors[n.id] = expandSubgraphInstance(flat, rootName, n.type, n);
            } else {
                var k = (n.kind === "IO") ? "IO" : "node";
                flat.nodes.push({kind:k, type:n.type, name:rootName, props:n});
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

    function renderFlattenedYaml(flat) {
        var yml = "";
        var i, n, a, props;
        yml += "# AUTOMATICALLY GENERATED ! " + (new Date()).toDateString() + "\n";
        yml += "# Subgraphs are flattened; internal names use '__' mangling.\n\n";
        yml += "nodes:\n";

        for (i=0; i<flat.nodes.length; i++) {
            n = flat.nodes[i];
            props = n.props || {};
            if (n.kind === "IO") {
                yml += "  - IO:   " + n.name + "\n";
                var ioFields = ["framel","period","per_hr","per_day","domain","nbchan",
                                "samprt","samprt_percent_accuracy","unit","scale","data_type",
                                "time_stamp","interleaving","params","paramtxt"];
                for (var j=0; j<ioFields.length; j++) yml = appendField(yml,props,ioFields[j]);
            } else {
                yml += "  - node: " + n.name + "\n";
                var m = manifestForType(n.type);
                if (m && m.parameters && m.parameters.length) {
                    yml = appendField(yml,props,"preset");
                    yml = appendField(yml,props,"maxopp");
                    yml = appendField(yml,props,"script");
                    yml = appendManifestParametersFrom(yml,n.type,props);
                } else {
                    yml = appendField(yml,props,"preset");
                    yml = appendField(yml,props,"params");
                    yml = appendField(yml,props,"paramtxt");
                    yml = appendField(yml,props,"maxopp");
                    yml = appendField(yml,props,"script");
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
            if (!isEmpty(a.attrs.dataType)) yml += "    data_type: " + a.attrs.dataType + "\n";
            if (!isEmpty(a.attrs.refresh)) yml += "    refresh: " + a.attrs.refresh + "\n";
            if (!isEmpty(a.attrs.jitterPercent)) yml += "    jitter_percent: " + a.attrs.jitterPercent + "\n";
            if (!isEmpty(a.attrs.overlayWith)) yml += "    overlay_with: " + a.attrs.overlayWith + "\n";
            if (!isEmpty(a.attrs.script)) yml += "    script: " + a.attrs.script + "\n";
        }
        return yml;
    }

    function save(force) {
        RED.storage.update();

        try {
            var exportWorkspace = exportRootWorkspaceId();
            var flat = buildFlattenedGraph(exportWorkspace);
            var hasIO = false;
            var i;
            for (i=0; i<flat.nodes.length; i++) {
                if (flat.nodes[i].kind === "IO") { hasIO = true; break; }
            }
            if (!hasIO) throw new Error("The graph has no input/output node");

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
        $('#btn-deploy').click(function() { save(); });
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
