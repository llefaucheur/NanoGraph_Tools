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
RED.nodes = (function() {

    var node_defs = {};
    var nodes = [];
    var configNodes = {};
    var links = [];
    var workspaces = {};

    function inferDomain(type, def) {
        if (def.category === "input-function") {
            if (/audio/.test(type)) return "audio_in";
            if (/2d/.test(type)) return "2d_in";
            if (/analog/.test(type)) return "analog_in";
            if (/ui/.test(type)) return "user_interface";
            if (/timer/.test(type)) return "time";
            if (/sensor/.test(type)) return "motion";
            return "general";
        }
        if (def.category === "output-function") {
            if (/audio/.test(type)) return "audio_out";
            if (/2d/.test(type)) return "2d_out";
            if (/analog/.test(type)) return "analog_out";
            if (/ui/.test(type)) return "user_interface";
            return "general";
        }
        return "";
    }

    function ensureDefault(def, name, value, required, validate) {
        def.defaults = def.defaults || {};
        if (!def.defaults[name]) {
            def.defaults[name] = {value:value || ""};
        }
        if (required != null) {
            def.defaults[name].required = required;
        }
        if (validate) {
            def.defaults[name].validate = validate;
        }
    }

    function augmentTypeDefaults(type, def) {
        if (def.category === "input-function" || def.category === "output-function") {
            ensureDefault(def, "domain", inferDomain(type, def), false);
            ensureDefault(def, "framel", "", true, RED.validators.positiveInteger());
            ensureDefault(def, "nbchan", "", true, RED.validators.positiveInteger());
            ensureDefault(def, "samprt", "", false, RED.validators.positiveNumber());
            ensureDefault(def, "period", "", false, RED.validators.positiveNumber());
            ensureDefault(def, "per_hr", "", false, RED.validators.positiveNumber());
            ensureDefault(def, "per_day", "", false, RED.validators.positiveNumber());
            ensureDefault(def, "samprt_percent_accuracy", "", false, RED.validators.nonNegativeNumber());
            ensureDefault(def, "unit", "", false);
            ensureDefault(def, "scale", "", false, RED.validators.positiveNumber());
            ensureDefault(def, "data_type", "float32", false, RED.validators.dataType());
            ensureDefault(def, "time_stamp", "", false, RED.validators.oneOf(["none","counter","delta","absolute"]));
            ensureDefault(def, "interleaving", "", false, RED.validators.oneOf(["sample","frame"]));
            ensureDefault(def, "params", "", false);
            ensureDefault(def, "paramtxt", "", false);
        } else if (def.category !== "config" && ((def.inputs || 0) > 0 || (def.outputs || 0) > 0)) {
            var manifest = (window.NG_NODE_MANIFESTS || {})[type];

            ensureDefault(def, "preset", "", false);
            ensureDefault(def, "maxopp", "", false, RED.validators.positiveInteger());
            ensureDefault(def, "script", "", false);

            if (manifest && manifest.parameters && manifest.parameters.length) {
                /* Remove the legacy unstructured parameter boxes when a manifest exists. */
                if (def.defaults) {
                    delete def.defaults.params;
                    delete def.defaults.paramtxt;
                }

                $.each(manifest.parameters, function(index, parameter) {
                    var defaultValue = (parameter["default"] == null) ? "" : parameter["default"];
                    ensureDefault(def, parameter.name, defaultValue, parameter.required === true);
                });
            } else {
                /* Backward-compatible nodes that do not yet have a manifest. */
                ensureDefault(def, "params", "", false);
                ensureDefault(def, "paramtxt", "", false);
            }
        }
    }

    function registerType(nt,def) {
        augmentTypeDefaults(nt,def);
        node_defs[nt] = def;

        RED.palette.add(nt,def);
    }

    function getID() {
        var str = (1+Math.random()*4294967295).toString(16);
        return str;
    }

    function checkID(name) {
        var i;
        for (i=0;i<nodes.length;i++) {
            if (nodes[i].id == name) return true;
        }
        return false;
    }

    function createUniqueCppName(n) {
        var basename = (n._def.shortName) ? n._def.shortName : n.type.replace(/^Analog/, "");
        var count = 0;
        var name;
        while (1) {
            name = basename + "[" + count + "]";
            if (!checkID(name)) break;
            count++;
        }
        return name;
    }

    function getUniqueName(n) {
        var newName = n.name;
        if (typeof newName === "string") {
            var parts = newName.match(/(\d*)$/);
            var count = 0;
            var base = newName;
            if (parts) {
                count = isNaN(parseInt(parts[1])) ? 0 : parseInt(parts[1]);
                base = newName.replace(count, "");
            }
            while (RED.nodes.namedNode(newName) !== null) {
                count += 1;
                newName = base + "[" + count + "]";
            }
        }
        return newName;
    }

    function getType(type) {
        return node_defs[type];
    }
    function selectNode(name) {
        if (!((document.origin == 'null') && (window.chrome))) {
            window.history.pushState(null, null, window.location.protocol + "//"
                + window.location.host + window.location.pathname + '?info=' + name);
        }
    }
    function addNode(n) {
        if (n._def.category == "config") {
            configNodes[n.id] = n;
            RED.sidebar.config.refresh();
        } else {
            n.dirty = true;
            nodes.push(n);
            var updatedConfigNode = false;
            for (var d in n._def.defaults) {
                if (n._def.defaults.hasOwnProperty(d)) {
                    var property = n._def.defaults[d];
                    if (property.type) {
                        var type = getType(property.type);
                        if (type && type.category == "config") {
                            var configNode = configNodes[n[d]];
                            if (configNode) {
                                updatedConfigNode = true;
                                configNode.users.push(n);
                            }
                        }
                    }
                }
            }
            if (updatedConfigNode) {
                RED.sidebar.config.refresh();
            }
        }
    }
    function addLink(l) {
        links.push(l);
    }

    function checkForIO() {
        var hasIO = false;
        RED.nodes.eachNode(function (node) {

            if ((node._def.category === "input-function") ||
                (node._def.category === "output-function")) {
                hasIO = true;
            }
        });
        return hasIO;
    }

    function getNode(id) {
        if (id in configNodes) {
            return configNodes[id];
        } else {
            for (var n in nodes) {
                if (nodes[n].id == id) {
                    return nodes[n];
                }
            }
        }
        return null;
    }

    function getNodeByName(name) {
        for (var n in nodes) {
            if (nodes[n].name == name) {
                return nodes[n];
            }
        }
        return null;
    }

    function removeNode(id) {
        var removedLinks = [];
        if (id in configNodes) {
            delete configNodes[id];
            RED.sidebar.config.refresh();
        } else {
            var node = getNode(id);
            if (node) {
                nodes.splice(nodes.indexOf(node),1);
                removedLinks = links.filter(function(l) { return (l.source === node) || (l.target === node); });
                removedLinks.map(function(l) {links.splice(links.indexOf(l), 1); });
            }
            var updatedConfigNode = false;
            for (var d in node._def.defaults) {
                if (node._def.defaults.hasOwnProperty(d)) {
                    var property = node._def.defaults[d];
                    if (property.type) {
                        var type = getType(property.type);
                        if (type && type.category == "config") {
                            var configNode = configNodes[node[d]];
                            if (configNode) {
                                updatedConfigNode = true;
                                var users = configNode.users;
                                users.splice(users.indexOf(node),1);
                            }
                        }
                    }
                }
            }
            if (updatedConfigNode) {
                RED.sidebar.config.refresh();
            }
        }
        return removedLinks;
    }

    function removeLink(l) {
        var index = links.indexOf(l);
        if (index != -1) {
            links.splice(index,1);
        }
    }

    function refreshValidation() {
        for (var n=0;n<nodes.length;n++) {
            RED.editor.validateNode(nodes[n]);
        }
    }

    function addWorkspace(ws) {
        workspaces[ws.id] = ws;
    }
    function getWorkspace(id) {
        return workspaces[id];
    }
    function removeWorkspace(id) {
        delete workspaces[id];
        var removedNodes = [];
        var removedLinks = [];
        var n;
        for (n=0;n<nodes.length;n++) {
            var node = nodes[n];
            if (node.z == id) {
                removedNodes.push(node);
            }
        }
        for (n=0;n<removedNodes.length;n++) {
            var rmlinks = removeNode(removedNodes[n].id);
            removedLinks = removedLinks.concat(rmlinks);
        }
        return {nodes:removedNodes,links:removedLinks};
    }

    function getAllFlowNodes(node) {
        var visited = {};
        visited[node.id] = true;
        var nns = [node];
        var stack = [node];
        while(stack.length !== 0) {
            var n = stack.shift();
            var childLinks = links.filter(function(d) { return (d.source === n) || (d.target === n);});
            for (var i=0;i<childLinks.length;i++) {
                var child = (childLinks[i].source === n)?childLinks[i].target:childLinks[i].source;
                if (!visited[child.id]) {
                    visited[child.id] = true;
                    nns.push(child);
                    stack.push(child);
                }
            }
        }
        return nns;
    }

    /**
     * Converts a node to an exportable JSON Object
     **/
    function convertNode(n, exportCreds) {
        exportCreds = exportCreds || false;
        var node = {};
        node.id = n.id;
        node.type = n.type;
        for (var d in n._def.defaults) {
            if (n._def.defaults.hasOwnProperty(d)) {
                node[d] = n[d];
            }
        }
        if(exportCreds && n.credentials) {
            node.credentials = {};
            for (var cred in n._def.credentials) {
                if (n._def.credentials.hasOwnProperty(cred)) {
                    if (n.credentials[cred] != null) {
                        node.credentials[cred] = n.credentials[cred];
                    }
                }
            }
        }
        if (n._def.category != "config") {
            node.x = n.x;
            node.y = n.y;
            node.z = n.z;
            node.wires = [];
            for(var i=0;i<n.outputs;i++) {
                node.wires.push([]);
            }
            var wires = links.filter(function(d){return d.source === n;});
            for (var j=0;j<wires.length;j++) {
                var w = wires[j];
                node.wires[w.sourcePort].push({
                    target: w.target.id,
                    targetPort: w.targetPort,
                    bufferSize: w.bufferSize || "",
                    arcName: w.arcName || "",
                    dataType: w.dataType || "",
                    refresh: w.refresh || "",
                    jitterPercent: w.jitterPercent || "",
                    overlayWith: w.overlayWith || "",
                    script: w.script || ""
                });
            }
        }
        return node;
    }

    /**
     * Converts the current node selection to an exportable JSON Object
     **/
    function createExportableNodeSet(set) {
        var nns = [];
        var exportedConfigNodes = {};
        for (var n=0;n<set.length;n++) {
            var node = set[n].n;
            var convertedNode = RED.nodes.convertNode(node);
            for (var d in node._def.defaults) {
                if (node._def.defaults[d].type && node[d] in configNodes) {
                    var confNode = configNodes[node[d]];
                    var exportable = getType(node._def.defaults[d].type).exportable;
                    if ((exportable == null || exportable)) {
                        if (!(node[d] in exportedConfigNodes)) {
                            exportedConfigNodes[node[d]] = true;
                            nns.unshift(RED.nodes.convertNode(confNode));
                        }
                    } else {
                        convertedNode[d] = "";
                    }
                }
            }

            nns.push(convertedNode);
        }
        return nns;
    }

    function createCompleteNodeSet() {
        var nns = [];
        var i;
        for (i in workspaces) {
            if (workspaces.hasOwnProperty(i)) {
                nns.push(workspaces[i]);
            }
        }
        for (i in configNodes) {
            if (configNodes.hasOwnProperty(i)) {
                nns.push(convertNode(configNodes[i], true));
            }
        }
        for (i=0;i<nodes.length;i++) {
            var node = nodes[i];
            nns.push(convertNode(node, true));
        }
        return nns;
    }

    /**
     * Parses the input string which contains copied code, scans the
     * nodes and connections and forms them into a JSON representation which will be
     * returned as string.
     *
     * So the result may directly imported in the localStorage or the import dialog.
     */
    function cppToJSON(newNodesStr) {

        var newNodes = [];
        var cables = [];
        var words = [];

        const NODE_COMMENT    = "//";
        const NODE_AC        = "Arc";

        var parseLine = function(line) {

            var parts = line.match(/^(\S+)\s(.*)/);
            if (parts == null) {
                return
            }
            parts =    parts.slice(1);
            if (parts == null || parts.length <= 1) {
                return
            }
            var type = $.trim(parts[0]);
            line = $.trim(parts[1]) + " ";

            var name = "";
            var coords = [0, 0];
            var conn = [];

            parts = line.match(/^([^;]{0,});(.*)/);
            if (parts && parts.length >= 2) {
                parts = parts.slice(1);
                if (parts && parts.length >= 1) {
                    name = $.trim(parts[0]);
                    coords = $.trim(parts[1]);
                    parts = coords.match(/^([^\/]{0,})\/\/xy=(.*)/);
                    if (parts) {
                        parts = parts.slice(1);
                        coords = $.trim(parts[1]).split(",");
                    }
                }
            }

            if (type == NODE_AC) {
                parts = name.match(/^([^\(]*\()([^\)]*)(.*)/);
                if (parts && parts.length > 1) {
                    conn = $.trim(parts[2]).split(",");
                    cables.push(conn);
                }
            } else if (type == NODE_COMMENT) {
                // do nothing
            } else {
                var names = [];
                var yPos = [];

                // may have imported a definition whose initializer has
                // commas in it; don't confuse this with a definition of
                // more than one object!
                while (name.match(/\([^)]*\)/)) // find stuff in matching brackets
                  name = name.replace(/\([^()]*\)/,'') // and remove it, including the brackets

                if (name.indexOf(",") >= 0) {
                    names = name.split(",");
                } else {
                    names.push(name);
                }
                for (var n = 0; n < names.length; n++) {
                    name = names[n].trim();
                    var gap = 10;
                    var def = node_defs[type];
                    var dW = Math.max(RED.view.defaults.width, RED.view.calculateTextWidth(name) + (def.inputs > 0 ? 7 : 0));
                    var dH = Math.max(RED.view.defaults.height,(Math.max(def.outputs, def.inputs)||0) * 15);
                    var newX = parseInt(coords ? coords[0] : 0) + n*20;
                    var newY = parseInt(coords ? coords[1] : 0) + n*20;
                    //newY = newY == 0 ? lastY + (dH * n) + gap : newY;
                    //lastY = Math.max(lastY, newY);
                    var node = new Object({"order": n, "id": name, "name": name, "type": type, "x": newX, "y": newY, "z": 0, "wires": []});
                    // netter solution: create new id
                    if (RED.nodes.node(node.id) !== null) {
                        node.z = RED.view.getWorkspace();
                        node.id = getID();
                        node.name = getUniqueName(node);
                    }
                    newNodes.push(node);
                }
            }
        };

        var findNode = function(name) {
            var len = newNodes.length;
            for (var key = 0; key < len; key++) {
                if (newNodes[key].id == name) {
                    return newNodes[key];
                }
            }
        };

        var linkCables = function(cables) {
            $.each(cables, function(i, item) {
                var conn = item;
                // when there are only two entries in the array, there
                // is only one output to connect to one input, so we have
                // to extend the array with the appropriate index "0" for
                // both parst (in and out)
                if (conn.length == 2) {
                    conn[2] = conn[1];
                    conn[1] = conn[3] = 0;
                }
                // now we assign the outputs (marked by the "idx" of the array)
                // to the inputs describend by text
                var currNode = findNode($.trim(conn[0]));
                var idx = parseInt($.trim(conn[1]));
                if (currNode) {
                    if ($.trim(conn[2]) != "" && $.trim(conn[3]) != "") {
                        var wire = $.trim(conn[2]) + ":" + $.trim(conn[3]);
                        var tmp = currNode.wires[idx] ? currNode.wires[idx] : [];
                        tmp.push(wire);
                        currNode.wires[idx] = tmp;
                    }
                }
            });
        };

        var traverseLines = function(raw) {
            var lines = raw.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();

                // we reached the setup or loop part ...
                var pattSu = new RegExp(/\s*void\s*setup\s*\(\s*\).*/);
                var pattLo = new RegExp(/\s*void\s*loop\s*\(\s*\).*/);
                if (pattSu.test(line) || pattLo.test(line)) {
                    break;
                }

                // we need at least two parts to examine
                var parts = line.match(/^(\S+)\s(.*)/);
                if (parts == null || parts.length == 1) {
                    continue;
                }

                // ... and it has to end with an semikolon ...
                var pattSe = new RegExp(/.*;.*$/);
                var pattCoord = new RegExp(/.*\/\/xy=\d+,\d+$/);
                if (pattSe.test(line) || pattCoord.test(line)) {
                    var word = parts[1].trim();
                    if (words.indexOf(word) >= 0) {
                        parseLine(line);
                    }
                }
            }
        };

/*
        var readCode = function() {

            var fileImport = $("#importInput")[0];
            var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.ino|.txt)$/;

            if (regex.test(fileImport.value.toLowerCase())) {
                if (typeof (FileReader) != "undefined") {
                    var reader = new FileReader();
                    $(reader).on("load", function (e) {
                    });
                    reader.readAsText(fileImport.files[0]);
                } else {
                    alert("This browser does not support HTML5.");
                }
            } else {
                alert("Please upload a valid INO or text file.");
            }
        };
 */
        function startImport() {
            words = Array(NODE_AC);
            $.each(node_defs, function (key, obj) {
                words.push(key);
            });
            traverseLines(newNodesStr);
            linkCables(cables);
        }

        startImport();

        return {
            count: newNodes.length,
            data: newNodes.length > 0 ? JSON.stringify(newNodes) : ""
        };
    }

    function importNodes(newNodesObj,createNewIds) {
        try {
            var i;
            var n;
            var newNodes;
            if (typeof newNodesObj === "string") {
                if (newNodesObj === "") {
                    return;
                }
                newNodes = JSON.parse(newNodesObj);
            } else {
                newNodes = newNodesObj;
            }

            if (!$.isArray(newNodes)) {
                newNodes = [newNodes];
            }
            var unknownTypes = [];
            for (i=0;i<newNodes.length;i++) {
                n = newNodes[i];

                if (n.type != "workspace" && n.type != "tab" && !getType(n.type)) {

                    n.name = n.type;
                    n.type = "unknown";
                    if (unknownTypes.indexOf(n.name)==-1) {
                        unknownTypes.push(n.name);
                    }
                    if (n.x == null && n.y == null) {
                        // config node - remove it
                        newNodes.splice(i,1);
                        i--;
                    }
                }
            }
var node_map = {};
            var new_nodes = [];
            var new_links = [];

            for (i=0;i<newNodes.length;i++) {
                n = newNodes[i];

                if (n.type !== "workspace" && n.type !== "tab") {
                    var def = getType(n.type);
                    if (def && def.category == "config") {
                        if (!RED.nodes.node(n.id)) {
                            var configNode = {id:n.id,type:n.type,users:[]};
                            for (var d in def.defaults) {
                                if (def.defaults.hasOwnProperty(d)) {
                                    configNode[d] = n[d];
                                }
                            }
                            configNode.label = def.label;
                            configNode._def = def;
                            RED.nodes.add(configNode);
                        }
                    } else {
                        var node = {x:n.x,y:n.y,z:n.z,type:0,wires:n.wires,changed:false};
                        if (createNewIds) {
                            node.z = RED.view.getWorkspace();
                            node.id = getID();
                        } else {
                            node.id = n.id;
                            if (node.z == null || !workspaces[node.z]) {
                                node.z = RED.view.getWorkspace();
                            }
                        }
                        node.type = n.type;
                        node._def = def;
                        if (!node._def) {
                            node._def = {
                                color:"#fee",
                                defaults: {},
                                label: "unknown: "+n.type,
                                labelStyle: "node_label_italic",
                                outputs: n.outputs||n.wires.length
                            }
                        }
                        node.outputs = n.outputs||node._def.outputs;

                        for (var d2 in node._def.defaults) {
                            if (node._def.defaults.hasOwnProperty(d2)) {
                                node[d2] = (n[d2] != null) ? n[d2] : node._def.defaults[d2].value;
                            }
                        }

                        node.name = getUniqueName(n);

                        addNode(node);
                        RED.editor.validateNode(node);
                        node_map[n.id] = node;
                        new_nodes.push(node);
                    }
                }
            }
            for (i=0;i<new_nodes.length;i++) {
                n = new_nodes[i];
                for (var w1=0;w1<n.wires.length;w1++) {
                    var wires = (n.wires[w1] instanceof Array)?n.wires[w1]:[n.wires[w1]];
                    for (var w2=0;w2<wires.length;w2++) {
                        if (wires[w2] != null) {
                            var wire = wires[w2];
                            var targetId;
                            var targetPort;
                            var bufferSize = "";
                            if (typeof wire === "string") {
                                var parts = wire.split(":");
                                if (parts.length == 2) {
                                    targetId = parts[0];
                                    targetPort = parts[1];
                                }
                            } else {
                                targetId = wire.target || wire.id;
                                targetPort = wire.targetPort;
                                bufferSize = wire.bufferSize || "";
                            }
                            if (targetId in node_map) {
                                var dst = node_map[targetId];
                                var link = {
                                    source:n,
                                    sourcePort:w1,
                                    target:dst,
                                    targetPort:targetPort,
                                    bufferSize:bufferSize,
                                    arcName: wire.arcName || "",
                                    dataType: wire.dataType || "",
                                    refresh: wire.refresh || "",
                                    jitterPercent: wire.jitterPercent || "",
                                    overlayWith: wire.overlayWith || "",
                                    script: wire.script || ""
                                };
                                addLink(link);
                                new_links.push(link);
                            }
                        }
                    }
                }
                delete n.wires;
            }
            return [new_nodes,new_links];
        } catch(error) {

            RED.notify("<strong>Error</strong>: "+error,"error");
            return null;
        }

    }

    return {
        registerType: registerType,
        getType: getType,
        convertNode: convertNode,
        selectNode: selectNode,
        add: addNode,
        addLink: addLink,
        remove: removeNode,
        removeLink: removeLink,
        addWorkspace: addWorkspace,
        removeWorkspace: removeWorkspace,
        workspace: getWorkspace,
        eachNode: function(cb) {
            for (var n=0;n<nodes.length;n++) {
                cb(nodes[n]);
            }
        },
        eachLink: function(cb) {
            for (var l=0;l<links.length;l++) {
                cb(links[l]);
            }
        },
        eachConfig: function(cb) {
            for (var id in configNodes) {
                if (configNodes.hasOwnProperty(id)) {
                    cb(configNodes[id]);
                }
            }
        },
        node: getNode,
        namedNode: getNodeByName,
        cppToJSON: cppToJSON,
        import: importNodes,
        refreshValidation: refreshValidation,
        getAllFlowNodes: getAllFlowNodes,
        createExportableNodeSet: createExportableNodeSet,
        createCompleteNodeSet: createCompleteNodeSet,
        id: getID,
        cppName: createUniqueCppName,
        hasIO: checkForIO,
        nodes: nodes,
        links: links
    };
})();
