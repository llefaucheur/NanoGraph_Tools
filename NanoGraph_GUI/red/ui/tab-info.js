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
RED.sidebar.info = (function() {

    var content = document.createElement("div");
    content.id = "tab-info";
    content.style.paddingTop = "4px";
    content.style.paddingLeft = "4px";
    content.style.paddingRight = "4px";

    RED.sidebar.addTab("info",content);
    $("#tab-info").html("");

    function jsonFilter(key,value) {
        if (key === "") {
            return value;
        }
        var t = typeof value;
        if ($.isArray(value)) {
            return "[array:"+value.length+"]";
        } else if (t === "object") {
            return "[object]"
        } else if (t === "string") {
            if (value.length > 30) {
                return value.substring(0,30)+" ...";
            }
        }
        return value;
    }

    function escapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;");
    }

    function getManifest(node) {
        return (window.NG_NODE_MANIFESTS || {})[node.type] || null;
    }

    function getManifestParameter(node, property) {
        var manifest = getManifest(node);
        if (!manifest || !manifest.parameters) return null;
        for (var i=0; i<manifest.parameters.length; i++) {
            if (manifest.parameters[i].name === property) return manifest.parameters[i];
        }
        return null;
    }

    function manifestOverview(node) {
        var manifest = getManifest(node);
        if (!manifest || !manifest.parameters || !manifest.parameters.length) return "";

        var html = '<div class="manifest-sidebar"><h4>Common Node Manifest</h4>';
        if (manifest.description) html += '<p>'+escapeHtml(manifest.description)+'</p>';
        html += '<table class="node-info"><tbody>';
        html += '<tr><td><b>Parameter</b></td><td><b>Value</b></td></tr>';
        for (var i=0; i<manifest.parameters.length; i++) {
            var p = manifest.parameters[i];
            var value = node[p.name];
            if (value == null || value === "") value = p["default"] == null ? "" : p["default"];
            html += '<tr><td>'+escapeHtml(p.name)+'</td><td>'+escapeHtml(value)+(p.unit?' '+escapeHtml(p.unit):'')+'</td></tr>';
        }
        html += '</tbody></table><p class="manifest-sidebar-note">Double-click the node and select a parameter to see its help here.</p></div>';
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
        if (p.unit) html += '<tr><td>Unit</td><td>'+escapeHtml(p.unit)+'</td></tr>';
        if (p.min != null) html += '<tr><td>Minimum</td><td>'+escapeHtml(p.min)+'</td></tr>';
        if (p.max != null) html += '<tr><td>Maximum</td><td>'+escapeHtml(p.max)+'</td></tr>';
        if (p.values) html += '<tr><td>Values</td><td>'+escapeHtml(p.values.join(", "))+'</td></tr>';
        html += '</tbody></table></div>';
        $("#tab-info").html(html);
    }

    function refresh(node) {
        var table = '<table class="node-info"><tbody>';

        table += "<tr><td>Type</td><td>&nbsp;"+node.type+"</td></tr>";
        table += "<tr><td>ID</td><td>&nbsp;"+node.id+"</td></tr>";
        table += '<tr class="blank"><td colspan="2">&nbsp;Properties</td></tr>';
        for (var n in node._def.defaults) {
            if (node._def.defaults.hasOwnProperty(n)) {
                var val = node[n]||"";
                var type = typeof val;
                if (type === "string") {
                    if (val.length > 30) {
                        val = val.substring(0,30)+" ...";
                    }
                    val = val.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
                } else if (type === "number") {
                    val = val.toString();
                } else if ($.isArray(val)) {
                    val = "[<br/>";
                    for (var i=0;i<Math.min(node[n].length,10);i++) {
                        var vv = JSON.stringify(node[n][i],jsonFilter," ").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
                        val += "&nbsp;"+i+": "+vv+"<br/>";
                    }
                    if (node[n].length > 10) {
                        val += "&nbsp;... "+node[n].length+" items<br/>";
                    }
                    val += "]";
                } else {
                    val = JSON.stringify(val,jsonFilter," ");
                    val = val.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
                }

                table += "<tr><td>&nbsp;"+n+"</td><td>"+val+"</td></tr>";
            }
        }
        table += "</tbody></table><br/>";
        table += manifestOverview(node);
        this.setHelpContent(table, node.type);
    }

    function setHelpContent(prefix, key) {
        // server test switched off - test purposes only
        var patt = new RegExp(/^[http|https]/);
        var server = false && patt.test(location.protocol);


        prefix = prefix == "" ? "<h3>" + key + "</h3>" : prefix;
        if (!server) {
            data = $("script[data-help-name|='" + key + "']").html();
            $("#tab-info").html(prefix + '<div class="node-help">' + data + '</div>');
        } else {
            $.get( "resources/help/" + key + ".html", function( data ) {
                $("#tab-info").html(prefix + '<h2>' + key + '</h2><div class="node-help">' + data + '</div>');
            }).fail(function () {
                $("#tab-info").html(prefix);
            });
        }
    }

    return {
        refresh:refresh,
        clear: function() {
            $("#tab-info").html("");
        },
        setHelpContent: setHelpContent,
        showParameterHelp: showParameterHelp
    }
})();
