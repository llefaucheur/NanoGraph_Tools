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
        "name": "i_conv_type",
        "type": "enum",
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
        "name": "o_conv_type",
        "type": "enum",
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
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
          "interleaving": "interleaved",
          "data_type": {
            "default": "float32",
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
          "same_as": {
            "interface": "rx_interface",
            "index": 0
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode_1",
        "type": "enum",
        "default": "none",
        "values": [
          "none",
          "lowpass",
          "highpass",
          "notch",
          "bandpass",
          "allpass",
          "peak",
          "lowshelf",
          "highshelf"
        ]
      },
      {
        "name": "cutoff_1",
        "type": "float",
        "unit": "0 .. 0.5"
      },
      {
        "name": "Q_1",
        "type": "float",
        "unit": "0 .. 5"
      },
      {
        "name": "gain_dB_1",
        "type": "float",
        "unit": "dB"
      },
      {
        "name": "mode_2",
        "type": "enum",
        "default": "none",
        "values": [
          "none",
          "lowpass",
          "highpass",
          "notch",
          "bandpass",
          "allpass",
          "peak",
          "lowshelf",
          "highshelf"
        ]
      },
      {
        "name": "cutoff_2",
        "type": "float",
        "unit": "0 .. 0.5"
      },
      {
        "name": "Q_2",
        "type": "float",
        "unit": "0 .. 5"
      },
      {
        "name": "gain_dB_2",
        "type": "float",
        "unit": "dB"
      },
      {
        "name": "mode_3",
        "type": "enum",
        "default": "none",
        "values": [
          "none",
          "lowpass",
          "highpass",
          "notch",
          "bandpass",
          "allpass",
          "peak",
          "lowshelf",
          "highshelf"
        ]
      },
      {
        "name": "cutoff_3",
        "type": "float",
        "unit": "0 .. 0.5"
      },
      {
        "name": "Q_3",
        "type": "float",
        "unit": "0 .. 5"
      },
      {
        "name": "gain_dB_3",
        "type": "float",
        "unit": "dB"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
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
          "check_input",
          "call_before_each_node",
          "call_after_each_node",
          "call_at_start_of_scheduling_loop",
          "call_at_end_of_scheduling_loop",
          "called_after_reset",
          "called_on_stop"
        ],
        "help": "options of \"main\" script, called during graph scheduling"
      }
    ],
    "implementation": {
      "header": "arm_script.h",
      "init": "arm_script_init",
      "process": "arm_script_process",
      "malloc": "precomputed",
      "reentrant": false,
      "compatibility": 101,
      "nb_memory_banks": 1,
      "memoryBank2": [
        {
          "index": 0,
          "malloc": 78,
          "mtype": "static",
          "mspeed": "normal"
        }
      ]
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
        "domain": "2d_in",
        "format": {
          "data_type": {
            "values": [
              "int8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
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
          "data_type": {
            "values": [
              "int8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "highquality",
        "values": [
          "lowpower",
          "intermediate",
          "highquality"
        ],
        "help": "encoding quality"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
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
            "default": "uint8",
            "values": [
              "uint8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
            ]
          }
        }
      },
      {
        "tx_interface": null,
        "index": 0,
        "name": "output0",
        "domain": "2d_out",
        "format": {
          "data_type": {
            "default": "uint8",
            "values": [
              "uint8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "highquality",
        "values": [
          "lowpower",
          "intermediate",
          "highquality"
        ],
        "help": "decoding quality"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_amplifier": {
    "node": "sigp_amplifier",
    "node_designer": "signal-processing.fr",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
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
        "name": "X",
        "type": "utf8",
        "X": null
      },
      {
        "name": "Y",
        "type": "utf8",
        "Y": null
      },
      {
        "name": "muted",
        "type": "int",
        "default": 0,
        "unit": "normalized"
      },
      {
        "name": "delay_down",
        "type": "float",
        "default": 0.02,
        "help": "delay_before_muted"
      },
      {
        "name": "delay_up",
        "type": "float",
        "default": 0.02,
        "help": "delay_before_unmuted"
      },
      {
        "name": "ramp_delay",
        "type": "float",
        "default": 0.15
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_analysis": {
    "node": "sigp_analysis",
    "node_designer": "signal-processing.fr",
    "version": 1,
    "description": "Extraction of features",
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
            "default": null,
            "values": null
          },
          "sample_rate": {
            "type": "float",
            "default": null,
            "values": null
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
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
          "data_type": {
            "default": "int16",
            "values": [
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": null,
            "values": null
          },
          "sample_rate": {
            "type": "float",
            "default": null,
            "values": null
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode_analysis",
        "type": "enum",
        "default": "none",
        "values": [
          "none",
          "results_on_output_port"
        ],
        "help": "Extraction of Metadata"
      }
    ],
    "activation": {
      "key": 8234758358235
    },
    "implementation": {
      "language": "C90",
      "complexity": "10e3",
      "header": "sigp_analysis.h",
      "init": "sigp_analysis_init",
      "process": "sigp_analysis_process",
      "processor_architecture": "armv7m, armv8m",
      "processor_fpu_option": "double",
      "malloc": "precomputed",
      "reentrant": true,
      "compatibility": 101,
      "nb_memory_banks": 2,
      "memoryBank1": [
        {
          "index": 0,
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_compressor": {
    "node": "sigp_compressor",
    "node_designer": "signal-processing.fr",
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
            "default": "uint8",
            "values": [
              "uint8",
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float",
            "default": 44100,
            "values": [
              8000,
              16000,
              32000,
              44100,
              48000
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8
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
          "data_type": {
            "default": "uint8",
            "values": [
              "uint8"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 1024,
            "values": [
              1024
            ]
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "bitsync",
        "type": "enum",
        "default": "none",
        "values": [
          "none",
          "LOAS",
          "ADTS",
          "AVCC"
        ],
        "help": "bitstream synchronization type"
      },
      {
        "name": "content",
        "type": "enum",
        "default": "alaw",
        "values": [
          "alaw",
          "ulaw",
          "imadpcm",
          "cvsd",
          "lpc",
          "sbc",
          "mp3"
        ],
        "help": "compression format of the input stream"
      },
      {
        "name": "inputformat",
        "type": "enum",
        "default": "int16",
        "values": [
          "int16",
          "float"
        ],
        "help": "16bits / 32bits output"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_decompressor": {
    "node": "sigp_decompressor",
    "node_designer": "signal-processing.fr",
    "version": 1,
    "description": "stream decompressor",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "data_type": {
            "default": "uint8",
            "values": [
              "uint8"
            ]
          },
          "frame_length": {
            "type": "int",
            "default": 1024,
            "values": [
              1024
            ]
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8
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
          "data_type": {
            "default": "uint8",
            "values": [
              "uint8",
              "int16",
              "float32"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float",
            "default": 44100,
            "values": [
              8000,
              16000,
              32000,
              44100,
              48000
            ]
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "bitsync",
        "type": "enum",
        "default": "none",
        "values": [
          "none",
          "LOAS",
          "ADTS",
          "AVCC"
        ],
        "help": "bitstream synchronization type"
      },
      {
        "name": "content",
        "type": "enum",
        "default": "alaw",
        "values": [
          "alaw",
          "ulaw",
          "imadpcm",
          "cvsd",
          "lpc",
          "sbc",
          "mp3"
        ],
        "help": "compression format of the input stream"
      },
      {
        "name": "outformat",
        "type": "enum",
        "default": "int16",
        "values": [
          "int16",
          "float"
        ],
        "help": "16bits / 32bits output"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_demodulator": {
    "node": "sigp_demodulator",
    "node_designer": "signal-processing.fr",
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
        "default": "uart",
        "values": [
          "uart",
          "sinef0"
        ],
        "help": "UART decoder, frequency and SNR estimator"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_detector": {
    "node": "sigp_detector",
    "node_designer": "signal-processing.fr",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "general",
        "format": {
          "unit": "VRMS",
          "unit_scale": 0.15,
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
        "domain": "audio_in",
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
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "voice",
        "values": [
          "voice",
          "music",
          "imu",
          "noise"
        ],
        "help": "signal detection type"
      },
      {
        "name": "sensitivity",
        "type": "float",
        "default": 0.2,
        "min": 0.0,
        "max": 1.0,
        "unit": "normalized",
        "help": "Normalized sensitivity"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_detector2D": {
    "node": "sigp_detector2D",
    "node_designer": "signal-processing.fr",
    "version": 1,
    "description": "CMSIS-DSP based filtering node",
    "interfaces": [
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "2d_in",
        "format": {
          "data_type": {
            "values": [
              "int8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
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
          "data_type": {
            "values": [
              "int8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "motion",
        "values": [
          "motion",
          "countObject"
        ],
        "help": "motion detector, counting object, background removal"
      },
      {
        "name": "background",
        "type": "float",
        "default": 0.0625,
        "min": 0.0,
        "max": 1.0,
        "unit": "normalized",
        "help": "background removal adaptation rate"
      },
      {
        "name": "sensitivity",
        "type": "float",
        "default": 0.2,
        "min": 0.0,
        "max": 1.0,
        "unit": "normalized",
        "help": "Normalized sensitivity"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
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
        "rx_interface": null
      },
      {
        "rx_interface": null,
        "index": 0,
        "name": "input0",
        "domain": "2d_in",
        "format": {
          "data_type": {
            "values": [
              "int8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
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
          "data_type": {
            "values": [
              "int8"
            ]
          },
          "frame_length": {
            "type": "int"
          },
          "sample_rate": {
            "type": "float"
          },
          "nb_channels": {
            "type": "int",
            "default": 1,
            "values": [
              1
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "filter",
        "values": [
          "lowpass",
          "highpass",
          "color",
          "rescale",
          "agc"
        ],
        "help": "Filter type / operating mode"
      },
      {
        "name": "cutoff",
        "type": "float",
        "default": 0.0625,
        "min": 0.0,
        "max": 1.0,
        "unit": "normalized",
        "help": "Normalized cutoff frequency"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_modulator": {
    "node": "sigp_modulator",
    "node_designer": "signal-processing.fr",
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
        "name": "wave",
        "type": "enum",
        "default": null,
        "values": [
          "sine",
          "whiteNoise",
          "pinkNoise",
          "square",
          "sawtooth",
          "prerecorded",
          "sigmaDelta",
          "PWM",
          "traiangle",
          "pulse"
        ],
        "help": "Main signal"
      },
      {
        "name": "modu_type",
        "type": "enum",
        "default": "amplitude",
        "values": [
          "amplitude",
          "frequency"
        ],
        "help": "modulation type"
      },
      {
        "name": "modu_index",
        "type": "float",
        "default": 0.0625,
        "min": 0.0,
        "max": 0.5,
        "unit": "normalized",
        "help": "modulation index"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
          "format": "format1"
        }
      ],
      "library": 16
    },
    "component_kind": "node"
  },
  "sigp_resampler": {
    "node": "sigp_resampler",
    "node_designer": "signal-processing.fr",
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
              3,
              4,
              8
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
              3,
              4,
              8
            ]
          }
        }
      }
    ],
    "parameters": [
      {
        "name": "mode",
        "type": "enum",
        "default": "highquality",
        "values": [
          "lowpower",
          "intermediate",
          "highquality"
        ],
        "help": "Filter length"
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
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
          "mreloc": 1,
          "mclear": 1,
          "mmdata0prog1": 0,
          "mtype": "static",
          "malloc_a": 24,
          "malloc_b": 12,
          "malloc_b_type": 0,
          "malloc_b_arc": 0,
          "malloc_c": 12,
          "malloc_c_arc": 0,
          "malloc_d": 12,
          "malloc_d_arc": 0,
          "mspeed": "fast"
        }
      ],
      "memoryBank2": [
        {
          "index": 1,
          "malloc_a": 78,
          "mtype": "working",
          "mspeed": "critical",
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
