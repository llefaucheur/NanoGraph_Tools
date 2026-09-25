#!/usr/bin/env node
/* Regression test for manifest-driven Info sidebar rendering. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
let lastHtml = '';
let graphNodes = [];

function jq(selector) {
    return {
        html: function(value) {
            if (value === undefined) {
                if (String(selector).indexOf('script[') === 0) return '';
                return lastHtml;
            }
            if (selector === '#tab-info') lastHtml = String(value);
            return this;
        }
    };
}
jq.isArray = Array.isArray;

const context = {
    console,
    window: {},
    document: { createElement: function(){ return {style:{}}; } },
    $: jq,
    RED: {
        sidebar: {
            addTab: function(){},
            info: null
        },
        nodes: {
            eachNode: function(cb){ graphNodes.forEach(cb); }
        }
    }
};
context.window.window = context.window;
vm.createContext(context);

function load(rel) {
    const file = path.join(root, rel);
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename:file});
}

load('red/format-resolver.js');
load('red/node-manifests.js');
load('red/platform-manifests.js');
load('red/ui/tab-info.js');

const computer = {
    type:'Computer', name:'Computer', id:'Computer', kind:'platform', z:'flow1',
    _def:{category:'Platforms', defaults:{kind:{value:'platform'}}}
};
const io = {
    type:'io_data_in', name:'io_data_in[0]', id:'io_data_in[0]', kind:'IO', z:'flow1',
    _def:{category:'input-function', defaults:{name:{value:''},kind:{value:'IO'}}}
};
const filter = {
    type:'arm_filter', name:'arm_filter[0]', id:'arm_filter[0]', kind:'node', z:'flow1',
    _def:{category:'arm', defaults:{name:{value:''},kind:{value:'node'}}}
};
graphNodes = [computer, io, filter];

function assertContains(haystack, needle, code) {
    if (haystack.indexOf(needle) < 0) {
        console.error('Missing expected Info text:', needle);
        process.exit(code);
    }
}

context.RED.sidebar.info.refresh(computer);
assertContains(lastHtml, 'Platform Manifest', 10);
assertContains(lastHtml, 'Desktop computer test platform', 11);

context.RED.sidebar.info.refresh(io);
assertContains(lastHtml, 'Platform I/O Manifest', 20);
assertContains(lastHtml, 'io_data_in[0]', 21);
assertContains(lastHtml, 'sample rate', 22);
assertContains(lastHtml, '16000', 23);
assertContains(lastHtml, 'protocol', 24);

context.RED.sidebar.info.refresh(filter);
assertContains(lastHtml, 'Node Manifest', 30);
assertContains(lastHtml, 'CMSIS-DSP based filtering node', 31);
assertContains(lastHtml, 'sample rate', 32);
assertContains(lastHtml, 'mode_1', 33);

console.log('Manifest Info sidebar regression tests passed.');
