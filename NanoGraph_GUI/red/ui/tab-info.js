/** Modified from original Node-Red source, for NanoGraph visualization
 * Copyright 2013 IBM Corp.
 * Licensed under the Apache License, Version 2.0.
 */
RED.sidebar.info = (function() {

    var content = document.createElement("div");
    content.id = "tab-info";
    content.style.paddingTop = "4px";
    content.style.paddingLeft = "4px";
    content.style.paddingRight = "4px";

    RED.sidebar.addTab("info",content);
    $("#tab-info").html("");

    function jsonFilter(key,value) {
        if (key === "") return value;
        var t = typeof value;
        if ($.isArray(value)) return "[array:"+value.length+"]";
        if (t === "object" && value !== null) return "[object]";
        if (t === "string" && value.length > 30) return value.substring(0,30)+" ...";
        return value;
    }

    function escapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;");
    }

    function isIoNode(node) {
        var category = node && node._def ? node._def.category : "";
        return !!(node && (node.kind === "IO" ||
               category === "input-function" || category === "output-function"));
    }

    function nodeManifest(node) {
        var manifests = window.NG_NODE_MANIFESTS || {};
        var type, key;
        if (!node) return null;

        type = String(node.type || "");
        if (manifests[type]) return manifests[type];

        /* Be tolerant of an editor/imported instance name being used as the
         * type. The manifest itself remains the source of truth; this fallback
         * only finds its key. */
        type = type.replace(/\[[0-9]+\]$/, "").replace(/_[0-9]+$/, "");
        if (manifests[type]) return manifests[type];

        for (key in manifests) {
            if (!manifests.hasOwnProperty(key)) continue;
            if (manifests[key] && String(manifests[key].node || "") === type) {
                return manifests[key];
            }
        }
        return null;
    }

    function platformManifest(node) {
        var manifests = window.NG_PLATFORM_MANIFESTS || {};
        var type, key;
        if (!node) return null;
        type = String(node.type || node.name || "");
        if (manifests[type]) return manifests[type];
        for (key in manifests) {
            if (!manifests.hasOwnProperty(key)) continue;
            if (manifests[key] && String(manifests[key].platform || "") === type) {
                return manifests[key];
            }
        }
        return null;
    }

    function selectedPlatformNode(contextNode) {
        var sameWorkspace = null;
        var anyPlatform = null;
        if (!RED.nodes || !RED.nodes.eachNode) return null;
        RED.nodes.eachNode(function(candidate) {
            if (!candidate || candidate.kind !== "platform") return;
            if (!anyPlatform) anyPlatform = candidate;
            if (contextNode && candidate.z === contextNode.z && !sameWorkspace) {
                sameWorkspace = candidate;
            }
        });
        return sameWorkspace || anyPlatform;
    }

    function ioManifestInfo(node) {
        var platformNode = selectedPlatformNode(node);
        var platform = platformManifest(platformNode);
        var resolver = window.NG_FORMAT_RESOLVER;
        var interfaceName, itf;

        if (!platform || !node) return null;
        interfaceName = String(node.name || node.id || "");

        if (resolver && resolver.findPlatformInterface) {
            itf = resolver.findPlatformInterface(platform, interfaceName);
        }

        /* Normally IO instances are named io_xxx[index]. If an old/imported
         * graph has no index in its display name, use the node type as index 0
         * only when the platform really exposes that interface. */
        if (!itf && resolver && resolver.findPlatformInterface &&
                interfaceName.indexOf("[") < 0) {
            itf = resolver.findPlatformInterface(platform, String(node.type || "") + "[0]");
        }

        if (!itf) return null;
        return {
            platformNode: platformNode,
            platform: platform,
            interfaceManifest: itf,
            interfaceName: interfaceName
        };
    }

    function selectedManifestInfo(node) {
        var ioInfo, manifest;
        if (!node) return null;

        if (node.kind === "platform") {
            manifest = platformManifest(node);
            return manifest ? {kind:"platform", manifest:manifest} : null;
        }

        if (isIoNode(node)) {
            ioInfo = ioManifestInfo(node);
            return ioInfo ? {
                kind:"io",
                manifest:ioInfo.interfaceManifest,
                platformNode:ioInfo.platformNode,
                platform:ioInfo.platform,
                interfaceName:ioInfo.interfaceName
            } : null;
        }

        manifest = nodeManifest(node);
        return manifest ? {kind:"node", manifest:manifest} : null;
    }

    function manifestTitle(info) {
        if (!info) return "Manifest";
        if (info.kind === "platform") return "Platform Manifest";
        if (info.kind === "io") return "Platform I/O Manifest";
        return "Node Manifest";
    }

    function getManifestParameter(node, property) {
        var manifest = nodeManifest(node);
        if (!manifest || !manifest.parameters) return null;
        for (var i=0; i<manifest.parameters.length; i++) {
            if (manifest.parameters[i].name === property) return manifest.parameters[i];
        }
        return null;
    }

    function isScalar(value) {
        return value === null || value === undefined ||
               typeof value === "string" || typeof value === "number" ||
               typeof value === "boolean";
    }

    function scalarText(value) {
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "true" : "false";
        return String(value);
    }

    function displayName(name) {
        return String(name == null ? "" : name).replace(/_/g," ");
    }

    function arrayOfScalars(value) {
        if (!$.isArray(value)) return false;
        for (var i=0; i<value.length; i++) {
            if (!isScalar(value[i])) return false;
        }
        return true;
    }

    function sectionHeading(name, level) {
        var tag = level <= 0 ? "h4" : (level === 1 ? "h5" : "h6");
        return "<"+tag+">"+escapeHtml(displayName(name))+"</"+tag+">";
    }

    /* Render every field of a manifest. Scalars are shown in Properties-style
     * tables. Nested objects/arrays become subsections, so no manifest field is
     * silently hidden merely because the schema grows. */
    function renderObject(name, obj, level, node) {
        var html = "";
        var scalarRows = [];
        var nested = [];
        var key, value;

        if (name) html += sectionHeading(name, level);

        if ($.isArray(obj)) {
            if (arrayOfScalars(obj)) {
                html += '<table class="node-info"><tbody>';
                html += '<tr><td>&nbsp;Values</td><td>'+escapeHtml(obj.join(", "))+'</td></tr>';
                html += '</tbody></table>';
                return html;
            }
            for (var ai=0; ai<obj.length; ai++) {
                html += renderObject((name || "item") + "[" + ai + "]", obj[ai], level+1, node);
            }
            return html;
        }

        if (isScalar(obj)) {
            html += '<table class="node-info"><tbody><tr><td>&nbsp;Value</td><td>'+escapeHtml(scalarText(obj))+'</td></tr></tbody></table>';
            return html;
        }

        for (key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            value = obj[key];
            if (isScalar(value)) {
                scalarRows.push({key:key, value:value});
            } else if (arrayOfScalars(value)) {
                scalarRows.push({key:key, value:value.join(", ")});
            } else {
                nested.push({key:key, value:value});
            }
        }

        if (scalarRows.length) {
            html += '<table class="node-info"><tbody>';
            for (var si=0; si<scalarRows.length; si++) {
                var row = scalarRows[si];
                var shown = scalarText(row.value);
                /* For node parameters, show the current graph-instance value as
                 * well as the manifest declaration/default. */
                if (name && /^parameters\[[0-9]+\]$/.test(name) && row.key === "default" && obj.name && node) {
                    var current = node[obj.name];
                    if (current !== undefined && current !== null && current !== "") {
                        shown += "   (current: " + scalarText(current) + ")";
                    }
                }
                html += '<tr><td>&nbsp;'+escapeHtml(displayName(row.key))+'</td><td>'+escapeHtml(shown)+'</td></tr>';
            }
            html += '</tbody></table>';
        }

        for (var ni=0; ni<nested.length; ni++) {
            html += renderObject(nested[ni].key, nested[ni].value, level+1, node);
        }
        return html;
    }

    function manifestOverview(node) {
        var info = selectedManifestInfo(node);
        var manifest;
        if (!info) return "";
        manifest = info.manifest;

        var html = '<div class="manifest-sidebar">';
        html += '<h3>'+escapeHtml(manifestTitle(info))+'</h3>';

        if (info.kind === "io") {
            html += '<table class="node-info"><tbody>';
            html += '<tr><td>&nbsp;Platform</td><td>'+escapeHtml((info.platform && info.platform.platform) || (info.platformNode && info.platformNode.type) || "")+'</td></tr>';
            html += '<tr><td>&nbsp;I/O instance</td><td>'+escapeHtml(info.interfaceName || node.name || node.id || "")+'</td></tr>';
            html += '</tbody></table>';
            html += renderObject("Interface Properties", manifest, 0, node);
        } else {
            html += renderObject("Properties", manifest, 0, node);
        }
        html += '</div>';
        return html;
    }

    function showParameterHelp(node, property) {
        var p = getManifestParameter(node, property);
        if (!p) return;

        var html = '<div class="manifest-parameter-help">';
        html += '<h3>'+escapeHtml(node.type)+'</h3>';
        html += '<h4><i class="fa fa-sliders"></i> '+escapeHtml(p.name)+'</h4>';
        if (p.help) html += '<p class="manifest-help-text">'+escapeHtml(p.help)+'</p>';
        html += '<table class="node-info"><tbody>';
        html += '<tr><td>Type</td><td>'+escapeHtml(p.type || "string")+'</td></tr>';
        if (p["default"] != null) html += '<tr><td>Default</td><td>'+escapeHtml(p["default"])+'</td></tr>';
        var current = node[p.name];
        if (current != null && current !== "") html += '<tr><td>Current</td><td>'+escapeHtml(current)+'</td></tr>';
        if (p.unit) html += '<tr><td>Unit</td><td>'+escapeHtml(p.unit)+'</td></tr>';
        if (p.min != null) html += '<tr><td>Minimum</td><td>'+escapeHtml(p.min)+'</td></tr>';
        if (p.max != null) html += '<tr><td>Maximum</td><td>'+escapeHtml(p.max)+'</td></tr>';
        if (p.values) html += '<tr><td>Values</td><td>'+escapeHtml(p.values.join(", "))+'</td></tr>';
        html += '</tbody></table></div>';
        $("#tab-info").html(html);
    }

    function instanceProperties(node) {
        var table = '<table class="node-info"><tbody>';
        table += "<tr><td>Type</td><td>&nbsp;"+escapeHtml(node.type)+"</td></tr>";
        table += "<tr><td>ID</td><td>&nbsp;"+escapeHtml(node.id)+"</td></tr>";
        table += '<tr class="blank"><td colspan="2">&nbsp;Instance Properties</td></tr>';
        for (var n in node._def.defaults) {
            if (!node._def.defaults.hasOwnProperty(n)) continue;
            var raw = node[n];
            var val = (raw === undefined || raw === null) ? "" : raw;
            var type = typeof val;
            if (type === "string") {
                if (val.length > 30) val = val.substring(0,30)+" ...";
                val = escapeHtml(val);
            } else if (type === "number" || type === "boolean") {
                val = escapeHtml(String(val));
            } else if ($.isArray(val)) {
                var av = "[<br/>";
                for (var i=0;i<Math.min(val.length,10);i++) {
                    var vv = JSON.stringify(val[i],jsonFilter," ");
                    av += "&nbsp;"+i+": "+escapeHtml(vv)+"<br/>";
                }
                if (val.length > 10) av += "&nbsp;... "+val.length+" items<br/>";
                av += "]";
                val = av;
            } else {
                val = escapeHtml(JSON.stringify(val,jsonFilter," "));
            }
            table += "<tr><td>&nbsp;"+escapeHtml(n)+"</td><td>"+val+"</td></tr>";
        }
        table += "</tbody></table><br/>";
        return table;
    }

    function refresh(node) {
        var prefix = instanceProperties(node) + manifestOverview(node);
        this.setHelpContent(prefix, node.type);
    }

    function setHelpContent(prefix, key) {
        var patt = new RegExp(/^[http|https]/);
        var server = false && patt.test(location.protocol);
        prefix = prefix == "" ? "<h3>" + escapeHtml(key) + "</h3>" : prefix;
        if (!server) {
            var data = $("script[data-help-name|='" + key + "']").html() || "";
            $("#tab-info").html(prefix + '<div class="node-help">' + data + '</div>');
        } else {
            $.get("resources/help/" + key + ".html", function(data) {
                $("#tab-info").html(prefix + '<h2>' + escapeHtml(key) + '</h2><div class="node-help">' + data + '</div>');
            }).fail(function() {
                $("#tab-info").html(prefix);
            });
        }
    }

    return {
        refresh:refresh,
        clear:function() { $("#tab-info").html(""); },
        setHelpContent:setHelpContent,
        showParameterHelp:showParameterHelp
    };
})();
