/* GENERATED from manifests/*.yaml and subgraphs/*.yaml - do not edit. */
window.NG_NODE_MANIFESTS = {
  "arm_filter": {
    "node": "arm_filter",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "ports": {
      "inputs": [
        {
          "name": "input",
          "index": 0,
          "data_type": "float32",
          "consume": 16
        }
      ],
      "outputs": [
        {
          "name": "output",
          "index": 0,
          "data_type": "float32",
          "produce": 16
        }
      ]
    },
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "lowpass",
        "values": [
          "lowpass",
          "highpass",
          "notch",
          "bandpass",
          "allpass",
          "peak",
          "lowshelf",
          "highshelf"
        ],
        "help": "Filter type / operating mode"
      },
      {
        "name": "cutoff",
        "type": "float",
        "default": 0.0625,
        "min": 0.0,
        "max": 0.5,
        "unit": "normalized",
        "help": "Normalized cutoff frequency. Nyquist frequency is 0.5."
      },
      {
        "name": "q",
        "type": "float",
        "default": 1.414,
        "min": 0.01,
        "help": "Quality factor of the filter."
      },
      {
        "name": "gain_db",
        "type": "float",
        "default": 20,
        "unit": "dB",
        "help": "Gain used by peak and shelf filters."
      }
    ],
    "implementation": {
      "language": "C",
      "header": "arm_filter.h",
      "init": "arm_filter_init",
      "process": "arm_filter_process"
    },
    "component_kind": "node"
  },
  "arm_filter_cascade": {
    "subgraph": "arm_filter_cascade",
    "version": 1,
    "description": "Two CMSIS-DSP arm_filter stages connected in cascade.",
    "ports": {
      "inputs": [
        {
          "name": "input",
          "index": 0,
          "data_type": "float32",
          "consume": 16,
          "help": "Input stream of the two-stage filter cascade."
        }
      ],
      "outputs": [
        {
          "name": "output",
          "index": 0,
          "data_type": "float32",
          "produce": 16,
          "help": "Output stream after the second filter stage."
        }
      ]
    },
    "parameters": [
      {
        "name": "stage1_cutoff",
        "type": "float",
        "default": 0.0625,
        "min": 0.0,
        "max": 0.5,
        "unit": "normalized",
        "bind": "arm_filter_0.cutoff",
        "help": "Cutoff frequency of the first arm_filter stage."
      },
      {
        "name": "stage2_cutoff",
        "type": "float",
        "default": 0.125,
        "min": 0.0,
        "max": 0.5,
        "unit": "normalized",
        "bind": "arm_filter_1.cutoff",
        "help": "Cutoff frequency of the second arm_filter stage."
      }
    ],
    "implementation": {
      "type": "graph"
    },
    "graph": {
      "nodes": [
        {
          "node": "arm_filter_0",
          "position": [
            300,
            220
          ],
          "parameters": {
            "mode": "lowpass",
            "cutoff": 0.0625,
            "q": 1.414,
            "gain_db": 0
          }
        },
        {
          "node": "arm_filter_1",
          "position": [
            520,
            220
          ],
          "parameters": {
            "mode": "lowpass",
            "cutoff": 0.125,
            "q": 1.414,
            "gain_db": 0
          }
        }
      ],
      "arcs": [
        {
          "from": "$in.0",
          "to": "arm_filter_0.0"
        },
        {
          "from": "arm_filter_0.0",
          "to": "arm_filter_1.0",
          "buffer_size": 16
        },
        {
          "from": "arm_filter_1.0",
          "to": "$out.0"
        }
      ]
    },
    "component_kind": "subgraph",
    "manifest_file": "subgraphs/arm_filter_cascade.yaml"
  }
};
