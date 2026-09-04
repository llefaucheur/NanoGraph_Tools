/* public domain
 * vim: set ts=4:
 */

RED.storage = (function() {

    /*
     * Subgraph editor workspaces are views of a Common Component Manifest.
     * They are deliberately transient and must never be persisted to
     * localStorage. Persisting them was the reason internal arcs disappeared
     * or reappeared in unexpected positions after reloading GUI.html.
     */
    function stripTransientSubgraphs(records) {
        var transientWorkspaces = {};
        var result = [];
        var i;
        var r;

        if (!records || !records.length) return records || [];

        /* First find the temporary subgraph workspaces. */
        for (i=0; i<records.length; i++) {
            r = records[i];
            if (r && r.type === "tab" && r.subgraphOwner) {
                transientWorkspaces[String(r.id)] = true;
            }
        }

        /* Then discard both the workspace records and all nodes inside them. */
        for (i=0; i<records.length; i++) {
            r = records[i];
            if (!r) continue;
            if (r.type === "tab" && transientWorkspaces[String(r.id)]) continue;
            if (r.z != null && transientWorkspaces[String(r.z)]) continue;
            result.push(r);
        }

        return result;
    }

    function update() {
        if (localStorage) {
            var nns = RED.nodes.createCompleteNodeSet();
            nns = stripTransientSubgraphs(nns);
            localStorage.setItem("audio_library_guitool", JSON.stringify(nns));
        }
    }

    function load() {
        if (localStorage) {
            var data = localStorage.getItem("audio_library_guitool");
            if (data) {
                try {
                    var parsed = JSON.parse(data);
                    var cleaned = stripTransientSubgraphs(parsed);

                    /*
                     * Repair localStorage immediately. This cleans subgraph
                     * editor records left by previous prototype versions.
                     */
                    localStorage.setItem(
                        "audio_library_guitool",
                        JSON.stringify(cleaned)
                    );
                    RED.nodes.import(cleaned, false);
                } catch(err) {
                    /* Compatibility with any old non-JSON representation. */
                    RED.nodes.import(data, false);
                }
            }
        }
    }

    function clear() {
        if (localStorage) {
            localStorage.removeItem("audio_library_guitool");
        }
    }

    return {
        update: update,
        load: load,
        clear: clear
    };
})();
