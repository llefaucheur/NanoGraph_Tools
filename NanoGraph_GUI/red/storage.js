/* public domain
 * vim: set ts=4:
 */

RED.storage = (function() {
    function update() {
        // TOOD: use setTimeout to limit the rate of changes?
        if (localStorage) {
            var nns = RED.nodes.createCompleteNodeSet();
            localStorage.setItem("audio_library_guitool", JSON.stringify(nns));
        }
    }
    function load() {
        if (localStorage) {
            var data = localStorage.getItem("audio_library_guitool");
            if (data) RED.nodes.import(data, false);
        }
    }
    function clear() {
        // TOOD: use setTimeout to limit the rate of changes?
        if (localStorage) {
            localStorage.removeItem("audio_library_guitool");
        }
    }
    return {
        update: update,
        load: load,
        clear: clear
    }
})();
