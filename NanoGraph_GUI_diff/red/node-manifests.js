/* GENERATED from manifests/*.yaml and subgraphs/*.yaml - do not edit. */
window.NG_NODE_MANIFESTS = {
  "arm_converter": {
    "node": "arm_converter",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "data converter",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "interleaving": {
            "type": "enum",
            "values": [
              "interleaved",
              "deinterleaved"
            ]
          },
          "data_type": {
            "default": "int16",
            "values": [
              "int8",
              "int16",
              "int32",
              "int64",
              "uint8",
              "uint16",
              "uint32",
              "uint64",
              "float32",
              "float64",
              "utf8",
              "utf16"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int"
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": {
            "type": "enum",
            "values": [
              "interleaved",
              "deinterleaved"
            ]
          },
          "data_type": {
            "default": "int16",
            "values": [
              "int8",
              "int16",
              "int32",
              "int64",
              "uint8",
              "uint16",
              "uint32",
              "uint64",
              "float32",
              "float64",
              "utf8",
              "utf16"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int"
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "i_data_type",
        "type": "enum",
        "values": [
          "int8",
          "int16",
          "int32",
          "int64",
          "uint8",
          "uint16",
          "uint32",
          "uint64",
          "float32",
          "float64",
          "utf8",
          "utf16"
        ],
        "help": "input data type"
      },
      {
        "name": "i_frame_length",
        "type": "int",
        "help": "input frame length"
      },
      {
        "name": "i_sample_rate",
        "type": "float"
      },
      {
        "name": "i_nb_channels",
        "type": "int"
      },
      {
        "name": "i_interleaving",
        "type": "enum",
        "values": [
          "interleaved",
          "deinterleaved"
        ]
      },
      {
        "name": "o_data_type",
        "type": "enum",
        "values": [
          "int8",
          "int16",
          "int32",
          "int64",
          "uint8",
          "uint16",
          "uint32",
          "uint64",
          "float32",
          "float64",
          "utf8",
          "utf16"
        ],
        "help": "outut data type"
      },
      {
        "name": "o_frame_length",
        "type": "int",
        "help": "output frame length"
      },
      {
        "name": "o_sample_rate",
        "type": "float"
      },
      {
        "name": "o_nb_channels",
        "type": "int"
      },
      {
        "name": "o_interleaving",
        "type": "enum",
        "values": [
          "interleaved",
          "deinterleaved"
        ]
      }
    ],
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_detector.h",
      "init": "sigp_detector_init",
      "process": "sigp_detector_process",
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
      "memoryBank2": [
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
  "arm_filter": {
    "node": "arm_filter",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
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
      "memoryBank2": [
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
  "arm_script": {
    "node": "arm_script",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "data converter",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "interleaving": {
            "type": "enum",
            "values": [
              "interleaved",
              "deinterleaved"
            ]
          },
          "data_type": {
            "default": "int16",
            "values": [
              "int8",
              "int16",
              "int32",
              "int64",
              "uint8",
              "uint16",
              "uint32",
              "uint64",
              "float32",
              "float64",
              "utf8",
              "utf16"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int"
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": {
            "type": "enum",
            "values": [
              "interleaved",
              "deinterleaved"
            ]
          },
          "data_type": {
            "default": "int16",
            "values": [
              "int8",
              "int16",
              "int32",
              "int64",
              "uint8",
              "uint16",
              "uint32",
              "uint64",
              "float32",
              "float64",
              "utf8",
              "utf16"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int"
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "none",
        "values": [
          "none",
          "before_nodes",
          "after_nodes",
          "start_of_scheduling",
          "end_of_scheduling"
        ],
        "help": "options of \"main\" script, called during graph scheduling"
      }
    ],
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_detector.h",
      "init": "sigp_detector_init",
      "process": "sigp_detector_process",
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
      "memoryBank2": [
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
  "bb_jpegenc": {
    "node": "bb_jpegenc",
    "node_designer": "bitbank",
    "version": 1,
    "description": "JPEG encoder",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
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
      "memoryBank2": [
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
  "eml_tjpgdec": {
    "node": "eml_tjpgdec",
    "node_designer": "EML",
    "version": 1,
    "description": null,
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
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
      "memoryBank2": [
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
  "sigp_amplifier": {
    "node": "sigp_amplifier",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "data_type": "int16",
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "same_as": {
            "interface": "rx_interface",
            "index": 0
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_amplifier.h",
      "init": "sigp_amplifier_init",
      "process": "sigp_amplifier_process",
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
      "memoryBank2": [
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
  "sigp_compressor": {
    "node": "sigp_compressor",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_compressor.h",
      "init": "sigp_compressor_init",
      "process": "sigp_compressor_process",
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
      "memoryBank2": [
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
  "sigp_decompressor": {
    "node": "sigp_decompressor",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_decompressor.h",
      "init": "sigp_decompressor_init",
      "process": "sigp_decompressor_process",
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
      "memoryBank2": [
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
  "sigp_demodulator": {
    "node": "sigp_demodulator",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_demodulator.h",
      "init": "sigp_demodulator_init",
      "process": "sigp_demodulator_process",
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
      "memoryBank2": [
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
  "sigp_detector": {
    "node": "sigp_detector",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_detector.h",
      "init": "sigp_detector_init",
      "process": "sigp_detector_process",
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
      "memoryBank2": [
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
  "sigp_detector2D": {
    "node": "sigp_detector2D",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_detector2D.h",
      "init": "sigp_detector2D_init",
      "process": "sigp_detector2D_process",
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
      "memoryBank2": [
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
  "sigp_filter2D": {
    "node": "sigp_filter2D",
    "node_designer": "signal-processing.fr",
    "version": 1,
    "description": "2D filters, interpolators, decimators",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
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
      "memoryBank2": [
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
  "sigp_modulator": {
    "node": "sigp_modulator",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
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
      "memoryBank2": [
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
  "sigp_resampler": {
    "node": "sigp_resampler",
    "node_designer": "arm (ltd)",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "interleaving": "interleaved",
          "unit": "VRMS",
          "unit_scale": 0.5,
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 4,
            "values": [
              1,
              2,
              3,
              4,
              8,
              16,
              32
            ]
          },
          "sample_rate": {
            "type": "float",
            "default": 16000,
            "values": [
              8000,
              16000,
              44100
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              4
            ]
          }
        }
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
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_resampler.h",
      "init": "sigp_resampler_init",
      "process": "sigp_resampler_process",
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
      "memoryBank2": [
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
  "sigp_router": {
    "node": "sigp_router",
    "version": 1,
    "description": "routering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      },
      {
        "rx_interface": null,
        "index": 1,
        "name": "input1",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      },
      {
        "rx_interface": null,
        "index": 2,
        "name": "input2",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      },
      {
        "rx_interface": null,
        "index": 3,
        "name": "input3",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      },
      {
        "tx_interface": null,
        "index": 1,
        "name": "output1",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      },
      {
        "tx_interface": null,
        "index": 2,
        "name": "output2",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      },
      {
        "tx_interface": null,
        "index": 3,
        "name": "output3",
        "domain": "general",
        "format": {
          "data_type": null,
          "frame_length": null,
          "sample_rate": null,
          "nb_channels": null
        }
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "src",
        "values": [
          "src",
          "merge",
          "split",
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
      "header": "sigp_router.h",
      "init": "sigp_router_init",
      "process": "sigp_router_process",
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
      "memoryBank2": [
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
