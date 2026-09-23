const fs = require('fs');
const path = require('path');
const main = fs.readFileSync(path.join(__dirname,'..','red','main.js'),'utf8');
const start = main.indexOf('    function parseGraphScalar');
const end = main.indexOf('    function importedWireAttrs');
if (start < 0 || end < 0 || end <= start) throw new Error('graph import helpers not found in main.js');
const helpers = main.slice(start,end);
const $ = {trim: v => String(v == null ? '' : v).trim()};
function isEmpty(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.length === 0);
}
eval(helpers);

const yaml = `graph_format_version: 1
graph_state: resolved
platform: Computer

nodes:
  - IO:   io_data_in[0]
  - node: arm_converter_0
    generated: true
    generated_by: format_resolver
    generated_reason: sample_rate
    parameters:
      i_sample_rate: 48000
      o_sample_rate: 16000
  - node: arm_filter_0
  - node: arm_converter_1
    parameters:
      i_sample_rate: 16000
      o_sample_rate: 8000
  - IO:   io_data_out[0]

arcs:
  - OPort_0 IO: io_data_in[0]
    IPort_0 node: arm_converter_0
    buffer_size: 128
    formatID: 3
  - OPort_0 node: arm_converter_0
    IPort_0 node: arm_filter_0
    formatID: 4
  - OPort_0 node: arm_filter_0
    IPort_0 node: arm_converter_1
  - OPort_0 node: arm_converter_1
    IPort_0 IO: io_data_out[0]

formats:
`;

let model = parseExportedGraphYaml(yaml);
if (model.graph_format_version !== 1) throw new Error('version parse failed');
if (model.platform !== 'Computer') throw new Error('platform parse failed');
if (model.nodes.length !== 5) throw new Error('node parse count failed');
if (!model.nodes.find(n => n.name === 'arm_converter_0').generated) throw new Error('generated marker not parsed');
if (model.nodes.find(n => n.name === 'arm_converter_1').generated) throw new Error('manual converter incorrectly marked generated');

collapseGeneratedNodes(model);
if (model.nodes.some(n => n.name === 'arm_converter_0')) throw new Error('generated converter was not removed');
if (!model.nodes.some(n => n.name === 'arm_converter_1')) throw new Error('manual converter was removed');
if (model.arcs.length !== 3) throw new Error('arc collapse count failed: ' + model.arcs.length);
const rebuilt = model.arcs.find(a => a.source.name === 'io_data_in[0]' && a.destination.name === 'arm_filter_0');
if (!rebuilt) throw new Error('logical arc was not rebuilt across generated converter');
if (rebuilt.attrs.formatID != null) throw new Error('resolved formatID leaked into logical graph');
if (String(rebuilt.attrs.buffer_size) !== '128') throw new Error('logical arc attributes were not preserved');
console.log('graph import generated/manual converter semantics pass');
