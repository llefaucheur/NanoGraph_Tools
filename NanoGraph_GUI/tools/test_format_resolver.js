const fs = require("fs");
const vm = require("vm");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const ctx = {window:{}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,"red","node-manifests.js"),"utf8"),ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,"red","platform-manifests.js"),"utf8"),ctx);
const R = require(path.join(ROOT,"red","format-resolver.js"));
const platform = ctx.window.NG_PLATFORM_MANIFESTS.Computer;
const amplifier = ctx.window.NG_NODE_MANIFESTS.sigp_amplifier;
const rx = R.findNodeInterface(amplifier,"rx",0);
function check(ioName, expectedType, expectedRate) {
  const io=R.findPlatformInterface(platform,ioName);
  if (!io) throw new Error("missing "+ioName);
  const type=R.choose("data_type",io.format.data_type,rx.format.data_type,{platformDefault:io.format.data_type.default});
  const rate=R.choose("sample_rate",io.format.sample_rate,rx.format.sample_rate,{platformDefault:io.format.sample_rate.default});
  console.log(ioName+" -> data_type="+type+" sample_rate="+rate+" c_platform_index="+io.c_platform_index);
  if (String(type)!==String(expectedType) || Number(rate)!==Number(expectedRate)) process.exit(2);
}
check("io_data_in[0]","int16",16000);
check("io_data_in[1]","int16",44100);
let rejected=false;
try { R.choose("data_type",{values:["float32"]},"int16",{}); } catch(e) { rejected=true; console.log("incompatible arc correctly rejected: "+e.message); }
if (!rejected) process.exit(3);


/* Wildcard regression: an endpoint with no format constraint accepts the other side. */
const wildcardType=R.choose("data_type","float32",undefined,{});
const wildcardRate=R.choose("sample_rate",{default:44100,values:[16000,44100]},undefined,{});
console.log("wildcard sink -> data_type="+wildcardType+" sample_rate="+wildcardRate);
if (String(wildcardType)!=="float32" || Number(wildcardRate)!==44100) process.exit(4);

/* Automatic-converter prerequisite: a genuine mismatch is distinguishable from wildcard. */
let mismatch=false;
try { R.choose("data_type","float32","int16",{}); } catch(e) { mismatch=true; }
if (!mismatch) process.exit(5);
console.log("converter case detected: float32 -> int16");

// Regression: old GUI io_sink[0] must resolve to canonical platform io_data_sink[0].
const sink = R.findPlatformInterface(platform, "io_sink[0]");
if (!sink || sink.name !== "io_data_sink" || Number(sink.index) !== 0) {
    throw new Error("io_sink[0] compatibility alias did not resolve to io_data_sink[0]");
}
const sinkType = R.choose("data_type", "float32", sink.format && sink.format.data_type, {});
const sinkRate = R.choose("sample_rate", 44100, sink.format && sink.format.sample_rate, {});
if (String(sinkType) !== "float32" || Number(sinkRate) !== 44100) {
    throw new Error("wildcard io_data_sink did not inherit producer format");
}
console.log("io_sink[0] alias -> io_data_sink[0] wildcard inherits float32/44100");


/* Interleaving is a first-class negotiated field. */
let interleavingMismatch=false;
try { R.choose("interleaving","interleaved","deinterleaved",{}); }
catch(e) { interleavingMismatch=true; console.log("converter case detected: interleaved -> deinterleaved"); }
if (!interleavingMismatch) process.exit(6);

/* Channel count is also negotiated and can require conversion. */
let channelMismatch=false;
try { R.choose("nb_channels",{default:2,values:[1,2]},4,{}); }
catch(e) { channelMismatch=true; console.log("converter case detected: nb_channels [1,2] -> 4"); }
if (!channelMismatch) process.exit(7);

/* Wildcards remain wildcards for the newly negotiated fields. */
if (R.choose("interleaving","interleaved",undefined,{}) !== "interleaved") process.exit(8);
if (Number(R.choose("nb_channels",2,undefined,{})) !== 2) process.exit(9);
console.log("wildcard negotiation also passes interleaving and nb_channels");

/* Resolved common formats are deduplicated and assigned by formatID. */
const formatArcs = [
  {attrs:{dataType:"int16",sampleRate:16000,nbChannels:2,interleaving:"interleaved"}},
  {attrs:{dataType:"int16",sampleRate:16000,nbChannels:2,interleaving:"interleaved"}},
  {attrs:{dataType:"float32",sampleRate:44100,nbChannels:1,interleaving:"deinterleaved"}}
];
const formatTable = R.buildFormatTable(formatArcs);
if (formatTable.length !== 2) throw new Error("format table did not deduplicate common formats");
if (formatArcs[0].attrs.formatID !== "0" || formatArcs[1].attrs.formatID !== "0" || formatArcs[2].attrs.formatID !== "1")
  throw new Error("formatID assignment is incorrect");
console.log("format table deduplication passes: 3 arcs -> 2 formats");

/* Graph-level IO selections constrain the platform capability. */
const out0=R.findPlatformInterface(platform,"io_data_out[0]");
const selectedInterleaving=R.applyEndpointOverride("interleaving",out0.format && out0.format.interleaving,"deinterleaved","io_data_out[0]");
let ioInterleavingMismatch=false;
try { R.choose("interleaving","interleaved",selectedInterleaving,{}); }
catch(e) { ioInterleavingMismatch=true; console.log("IO graph override triggers converter: interleaved -> deinterleaved"); }
if (!ioInterleavingMismatch) process.exit(10);
const requestedChannels=R.applyEndpointOverride("nb_channels",out0.format.nb_channels,6,"io_data_out[0]");
if (Number(requestedChannels) !== 6) process.exit(11);
let ioChannelMismatch=false;
try { R.choose("nb_channels",1,requestedChannels,{}); }
catch(e) { ioChannelMismatch=true; console.log("IO graph override triggers converter: nb_channels 1 -> 6"); }
if (!ioChannelMismatch) process.exit(12);
