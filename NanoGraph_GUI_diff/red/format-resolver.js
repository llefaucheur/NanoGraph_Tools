/* NanoGraph stream-format constraint resolver.
 * No DOM dependency: this file can also be tested with Node.js.
 */
(function(root, factory) {
    var api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    if (root) root.NG_FORMAT_RESOLVER = api;
}(typeof window !== "undefined" ? window : this, function() {
    "use strict";

    function isObject(v) { return v && typeof v === "object" && !Array.isArray(v); }
    function has(v) { return v !== undefined && v !== null && v !== ""; }
    function same(a,b) { return String(a) === String(b); }

    function normalizeConstraint(raw) {
        var c = {values:[], defaultValue:null, exact:false};
        var i;
        if (!has(raw)) return c;
        if (!isObject(raw)) {
            c.values = [raw]; c.defaultValue = raw; c.exact = true; return c;
        }
        if (Array.isArray(raw.values)) {
            for (i=0; i<raw.values.length; i++) c.values.push(raw.values[i]);
        }
        if (has(raw.default)) c.defaultValue = raw.default;
        if (!c.values.length && has(c.defaultValue)) c.values = [c.defaultValue];
        if (c.values.length === 1) c.exact = true;
        return c;
    }

    function contains(c, value) {
        var i;
        if (!has(value)) return true;
        if (!c || !c.values || !c.values.length) return true;
        for (i=0; i<c.values.length; i++) if (same(c.values[i], value)) return true;
        return false;
    }

    function intersection(a,b) {
        var result=[], i, j;
        if (!a.values.length && !b.values.length) return result;
        if (!a.values.length) return b.values.slice(0);
        if (!b.values.length) return a.values.slice(0);
        for (i=0; i<a.values.length; i++) {
            for (j=0; j<b.values.length; j++) {
                if (same(a.values[i],b.values[j])) { result.push(a.values[i]); break; }
            }
        }
        return result;
    }

    function choose(field, producerRaw, consumerRaw, options) {
        var p=normalizeConstraint(producerRaw);
        var c=normalizeConstraint(consumerRaw);
        var common=intersection(p,c);
        var requested=options && options.requested;
        var platformDefault=options && options.platformDefault;
        var candidates=[], i, v;

        if (has(requested)) {
            if (!contains(p,requested) || !contains(c,requested))
                throw new Error(field + " explicit value '" + requested + "' is incompatible with one endpoint");
            return requested;
        }
        if (p.values.length && c.values.length && !common.length)
            throw new Error(field + " has no common value (producer=" + p.values.join(",") +
                            "; consumer=" + c.values.join(",") + ")");

        /* A true singleton is a hard endpoint constraint. */
        if (p.exact && contains(c,p.values[0])) return p.values[0];
        if (c.exact && contains(p,c.values[0])) return c.values[0];

        /* Platform IO defaults describe the preferred physical interface setup. */
        candidates.push(platformDefault);
        candidates.push(p.defaultValue);
        candidates.push(c.defaultValue);
        for (i=0; i<candidates.length; i++) {
            v=candidates[i];
            if (has(v) && contains(p,v) && contains(c,v)) return v;
        }
        if (common.length) return common[0];
        if (has(p.defaultValue) && contains(c,p.defaultValue)) return p.defaultValue;
        if (has(c.defaultValue) && contains(p,c.defaultValue)) return c.defaultValue;
        return null;
    }

    /*
     * Interleaving has no semantic meaning for a mono stream.  This helper
     * must be called after nb_channels has been resolved.  When both sides
     * are known to be one channel, any interleaved/deinterleaved difference
     * is accepted and the result is canonicalized to "interleaved".
     */
    function chooseInterleaving(producerRaw, consumerRaw, producerChannels, consumerChannels, options) {
        var pc = has(producerChannels) ? Number(producerChannels) : null;
        var cc = has(consumerChannels) ? Number(consumerChannels) : null;
        if (pc === 1 && cc === 1) return "interleaved";
        return choose("interleaving", producerRaw, consumerRaw, options || {});
    }

    function canonicalInterleaving(interleaving, nbChannels) {
        if (has(nbChannels) && Number(nbChannels) === 1) return "interleaved";
        return interleaving;
    }


    function platformDefaultAsExact(raw) {
        /*
         * For a physical sink reached from a same_as output, the platform
         * default is the selected operating point, not merely a preference.
         * Keep unconstrained fields unconstrained.
         */
        var c = normalizeConstraint(raw);
        if (has(c.defaultValue)) return c.defaultValue;
        return raw;
    }

    function applyEndpointOverride(field, capabilityRaw, overrideValue, endpointName) {
        /*
         * A non-empty graph IO value is the requested graph-side format.
         * It intentionally becomes an exact endpoint constraint even when it
         * is outside the platform manifest's preferred/advertised values.
         *
         * Why: the graph exporter may insert arm_converter between the
         * upstream/downstream processing node and the IO endpoint. Rejecting
         * the requested value here would abort before that transformation can
         * be attempted. The platform manifest remains the source of defaults
         * and candidate values when the graph does not request a value.
         */
        void endpointName;
        void capabilityRaw;
        if (!has(overrideValue)) return capabilityRaw;
        if (field === "sample_rate" && Number(overrideValue) === 0) return capabilityRaw;
        return overrideValue;
    }


    /*
     * frame_length is deliberately NOT part of format negotiation.  It is a
     * local producer/consumer processing granularity used only to size the FIFO.
     * A scalar is already concrete; for a constraint object use its default,
     * then its first advertised value.  A type-only/absent constraint is unknown.
     */
    function frameLengthValue(raw) {
        var c=normalizeConstraint(raw);
        var v=null;
        if (c.exact && c.values.length) v=c.values[0];
        else if (has(c.defaultValue)) v=c.defaultValue;
        else if (c.values.length) v=c.values[0];
        if (!has(v)) return null;
        v=Number(v);
        if (!isFinite(v) || v < 0 || Math.floor(v) !== v)
            throw new Error("frame_length must be a non-negative integer");
        return v;
    }

    function fifoSizeFromFrameLengths(producerRaw, consumerRaw) {
        var p=frameLengthValue(producerRaw);
        var c=frameLengthValue(consumerRaw);
        if (p === null && c === null) return null;
        if (p === null) return c;
        if (c === null) return p;
        return p > c ? p : c;
    }

    function buildFormatTable(arcs) {
        var formats=[];
        var byKey={};
        var i, a, attrs, f, key, id;
        arcs=arcs || [];
        for (i=0; i<arcs.length; i++) {
            a=arcs[i];
            attrs=a.attrs || {};
            f={
                dataType:has(attrs.dataType) ? attrs.dataType : null,
                sampleRate:has(attrs.sampleRate) ? attrs.sampleRate : null,
                nbChannels:has(attrs.nbChannels) ? attrs.nbChannels : null,
                interleaving:has(attrs.interleaving) ? attrs.interleaving : null
            };
            f.interleaving = canonicalInterleaving(f.interleaving, f.nbChannels);
            attrs.interleaving = f.interleaving;
            key=String(f.dataType)+"|"+String(f.sampleRate)+"|"+
                String(f.nbChannels)+"|"+String(f.interleaving);
            if (!Object.prototype.hasOwnProperty.call(byKey,key)) {
                id=formats.length;
                byKey[key]=id;
                f.formatID=id;
                formats.push(f);
            } else id=byKey[key];
            attrs.formatID=String(id);
        }
        return formats;
    }

    function splitIoName(name) {
        var m=String(name).match(/^(.*)\[([0-9]+)\]$/);
        if (!m) return {name:String(name), index:-1};
        return {name:m[1], index:parseInt(m[2],10)};
    }

    function findPlatformInterface(platformManifest, ioName) {
        var key=splitIoName(ioName), instances, i, list, j, itf;
        if (!platformManifest) return null;
        /* Accept old saved/exported GUI name; platform manifests use the
         * canonical logical interface name io_data_sink. */
        if (key.name === "io_sink") key.name = "io_data_sink";
        instances=platformManifest.interpreter_instances || [];
        for (i=0; i<instances.length; i++) {
            list=instances[i].interfaces || [];
            for (j=0; j<list.length; j++) {
                itf=list[j] && (list[j].interface || list[j]);
                if (itf && itf.name === key.name && Number(itf.index) === key.index) return itf;
            }
        }
        return null;
    }

    function findNodeInterface(nodeManifest, direction, port) {
        var list=(nodeManifest && nodeManifest.interfaces) || [], i, item, itf;
        var key=(direction === "tx") ? "tx_interface" : "rx_interface";
        for (i=0; i<list.length; i++) {
            item=list[i] || {};
            if (Object.prototype.hasOwnProperty.call(item,key)) {
                itf = item[key] || item;
                if (Number(itf.index) === Number(port)) return itf;
            }
        }
        return null;
    }

    return {
        normalizeConstraint:normalizeConstraint,
        contains:contains,
        choose:choose,
        chooseInterleaving:chooseInterleaving,
        canonicalInterleaving:canonicalInterleaving,
        platformDefaultAsExact:platformDefaultAsExact,
        applyEndpointOverride:applyEndpointOverride,
        frameLengthValue:frameLengthValue,
        fifoSizeFromFrameLengths:fifoSizeFromFrameLengths,
        buildFormatTable:buildFormatTable,
        splitIoName:splitIoName,
        findPlatformInterface:findPlatformInterface,
        findNodeInterface:findNodeInterface
    };
}));
