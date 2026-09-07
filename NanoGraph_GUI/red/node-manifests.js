/* GENERATED from manifests/*.yaml and subgraphs/*.yaml - do not edit. */
window.NG_NODE_MANIFESTS = {
  "arm_filter": {
    "node": "arm_filter",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "ports": {
      "nb_input": 1,
      "nb_output": 1,
      "inputs": [
        {
          "name": "input",
          "index": 0,
          "buffer_overlay": 0,
          "format": "inputfmt"
        }
      ],
      "outputs": [
        {
          "name": "output",
          "index": 0,
          "format": "outputfmt"
        }
      ]
    },
    "formats": [
      {
        "format": "inputfmt",
        "interleaving": "interleaved",
        "data_type_default": "int16",
        "data_type_values": [
          "int16",
          "float32"
        ],
        "frame_length_default": 4,
        "frame_length_values": [
          1,
          2,
          3,
          4,
          8,
          16,
          32
        ],
        "sample_rate_type": "float",
        "sample_rate_default": 16000,
        "sample_rate_values": [
          8000,
          16000,
          44100.5
        ],
        "sample_rate_accuracy": 5.5,
        "nb_channels_default": 1,
        "nb_channels_values": [
          1,
          2,
          4
        ],
        "unit": "VRMS",
        "unit_scale": 0.5
      },
      {
        "format": "outputfmt",
        "data_type_default": "int16",
        "data_type_values": [
          "int16",
          "float32"
        ],
        "frame_length_default": 4,
        "frame_length_values": [
          1,
          2,
          3,
          4,
          8,
          16,
          32
        ],
        "sample_rate_type": "float",
        "sample_rate_default": 16000,
        "sample_rate_values": [
          8000,
          16000,
          44100.5
        ],
        "sample_rate_accuracy": 5.5,
        "nb_channels_default": 1,
        "nb_channels_values": [
          1,
          2,
          4
        ]
      }
    ],
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
      "language": "C90",
      "complexity": "10e3",
      "header": "arm_filter.h",
      "init": "arm_filter_init",
      "process": "arm_filter_process",
      "processor_architecture": "armv7m, armv8m",
      "processor_fpu_option": "double",
      "malloc": "precomputed",
      "reentrant": true,
      "compatibility": 101,
      "nb_memory_banks": 2,
      "memoryBank1": [
        {
          "index": 0,
          "relocatable": 1,
          "memory_clear": 1,
          "data0prog1": 0,
          "mem_alloc": 24,
          "mem_type": "static",
          "mem_alloc_a": 12,
          "mem_alloc_b": 12,
          "mem_alloc_b_type": 0,
          "mem_alloc_b_arc": 0,
          "mem_alloc_c": 12,
          "mem_alloc_c_arc": 0,
          "mem_alloc_d": 12,
          "mem_alloc_d_arc": 0
        }
      ],
      "input2": [
        {
          "index": 1,
          "mem_alloc": 78,
          "mem_type": "working",
          "mem_speed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "arm_router": {
    "node": "arm_router",
    "version": 1,
    "description": "CMSIS-DSP based routering node",
    "ports": {
      "inputs": [
        {
          "name": "input1",
          "index": 0,
          "format": "format_input_1_2"
        },
        {
          "name": "input2",
          "index": 1,
          "format": "format_input_1_2"
        },
        {
          "name": "input3",
          "index": 2,
          "format": "format_input_3_4"
        },
        {
          "name": "input4",
          "index": 3,
          "format": "format_input_3_4"
        }
      ],
      "outputs": [
        {
          "name": "output1",
          "index": 0,
          "format": "format_output_1_2_3_4"
        },
        {
          "name": "output2",
          "index": 1,
          "format": "format_output_1_2_3_4"
        },
        {
          "name": "output3",
          "index": 2,
          "format": "format_output_1_2_3_4"
        },
        {
          "name": "output4",
          "index": 3,
          "format": "format_output_1_2_3_4"
        }
      ]
    },
    "formats": [
      {
        "format": "format_input_1_2",
        "data_type": "float32",
        "consume_min": 2,
        "consume_max": 16,
        "interleaving": "interleaved",
        "nb_channels_min": 1,
        "nb_channels_max": 2
      },
      {
        "format": "format_input_3_4",
        "data_type": "float32",
        "consume_min": 2,
        "consume_max": 32,
        "interleaving": "interleaved",
        "nb_channels_min": 1,
        "nb_channels_max": 32
      },
      {
        "format": "format_output_1_2_3_4",
        "data_type": "float32",
        "produce_min": 2,
        "produce_max": 32,
        "interleaving": "interleaved",
        "nb_channels_min": 1,
        "nb_channels_max": 32
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "src",
        "values": [
          "src",
          "raw"
        ],
        "help": "converter"
      },
      {
        "name": "gain_db",
        "type": "float",
        "default": 20,
        "unit": "dB",
        "help": "Gain used by peak and shelf routers."
      }
    ],
    "activation": {
      "key": 823475928358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "arm_router.h",
      "init": "arm_router_init",
      "process": "arm_router_process",
      "processor_architecture": "armv7m, armv8m",
      "processor_fpu_option": "double",
      "malloc": "precomputed",
      "reentrant": true,
      "compatibility": 101,
      "nb_memory_banks": 2,
      "memoryBank1": [
        {
          "index": 0,
          "relocatable": 1,
          "memory_clear": 1,
          "data0prog1": 0,
          "mem_alloc": 24,
          "mem_type": "static",
          "mem_alloc_a": 12,
          "mem_alloc_b": 12,
          "mem_alloc_b_type": 0,
          "mem_alloc_b_arc": 0,
          "mem_alloc_c": 12,
          "mem_alloc_c_arc": 0,
          "mem_alloc_d": 12,
          "mem_alloc_d_arc": 0
        }
      ],
      "input2": [
        {
          "index": 1,
          "mem_alloc": 78,
          "mem_type": "working",
          "mem_speed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
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
