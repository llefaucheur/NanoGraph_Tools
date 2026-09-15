/* GENERATED from platforms/*.yaml - do not edit. */
window.NG_PLATFORM_MANIFESTS = {
  "Computer": {
    "platform": "Computer",
    "version": 1,
    "description": "Desktop computer test platform (Windows, macOS or Linux).",
    "file_paths": [
      {
        "path_to": "node_manifest_arm",
        "index": 0,
        "path": "../manifests"
      },
      {
        "path_to": "node_manifest_sigp",
        "index": 1,
        "path": "../manifests"
      }
    ],
    "processors": [
      {
        "processor": null,
        "archID": "armv7m",
        "procID": 0,
        "nodes": [
          {
            "node": null,
            "path": 0,
            "index": 1,
            "name": "arm_script"
          },
          {
            "node": null,
            "path": 0,
            "index": 2,
            "name": "arm_filter"
          },
          {
            "node": null,
            "path": 0,
            "index": 3,
            "name": "arm_converter"
          },
          {
            "node": null,
            "path": 0,
            "index": 4,
            "name": "bb_jpegenc"
          },
          {
            "node": null,
            "path": 0,
            "index": 5,
            "name": "eml_tjpgdec"
          },
          {
            "node": null,
            "path": 0,
            "index": 6,
            "name": "sigp_amplifier"
          },
          {
            "node": null,
            "path": 0,
            "index": 7,
            "name": "sigp_modulator"
          },
          {
            "node": null,
            "path": 0,
            "index": 8,
            "name": "sigp_demodulator"
          },
          {
            "node": null,
            "path": 0,
            "index": 9,
            "name": "sigp_filter2D"
          },
          {
            "node": null,
            "path": 0,
            "index": 10,
            "name": "sigp_detector"
          },
          {
            "node": null,
            "path": 0,
            "index": 11,
            "name": "sigp_detector2D"
          },
          {
            "node": null,
            "path": 0,
            "index": 12,
            "name": "sigp_resampler"
          },
          {
            "node": null,
            "path": 0,
            "index": 13,
            "name": "sigp_compressor"
          },
          {
            "node": null,
            "path": 0,
            "index": 14,
            "name": "sigp_decompressor"
          },
          {
            "node": null,
            "path": 0,
            "index": 15,
            "name": "sigp_router"
          }
        ]
      },
      {
        "processor": null,
        "archID": "armv7m",
        "procID": 0,
        "nodes": [
          {
            "node": null,
            "path": 0,
            "index": 2,
            "name": "sigp_filter2D"
          }
        ]
      }
    ],
    "memories": [
      {
        "memory": "shared",
        "index": 0,
        "size": 8000,
        "access": 0,
        "speed": 0,
        "type": 0,
        "instance": -1
      },
      {
        "memory": "SRAM",
        "index": 1,
        "size": 8000,
        "access": 0,
        "speed": 0,
        "type": 0,
        "subblocks": [
          {
            "subblock": null,
            "index": 0,
            "name": "sram1",
            "base": 0,
            "size": 1014
          },
          {
            "subblock": null,
            "index": 1,
            "name": "sram2",
            "base": 1024,
            "size": 1014
          }
        ],
        "instance": -1
      },
      {
        "memory": "RET",
        "index": 2,
        "size": 80,
        "access": 0,
        "speed": 0,
        "type": 1,
        "instance": -1
      },
      {
        "memory": "private0",
        "index": 3,
        "size": 8000,
        "speed": 2,
        "instance": 0
      },
      {
        "memory": "private1",
        "index": 4,
        "size": 80,
        "instance": 1
      }
    ],
    "interpreter_instances": [
      {
        "instance": "MAIN",
        "index": 0,
        "archID": "armv7m",
        "procID": 0,
        "priority": 1,
        "trace_depth": 256,
        "trace_verbosity": 2,
        "memory_isolation": 1,
        "interfaces": [
          {
            "interface": null,
            "index": 0,
            "c_platform_index": 0,
            "name": "io_data_sink",
            "direction": "tx",
            "domain": "general"
          },
          {
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 1,
            "name": "io_data_in",
            "direction": "rx",
            "domain": "general",
            "format": {
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
            "interface": null,
            "path": 1,
            "index": 1,
            "c_platform_index": 2,
            "name": "io_data_in",
            "direction": "rx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 3,
            "name": "io_data_out",
            "direction": "tx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 1,
            "c_platform_index": 4,
            "name": "io_data_out",
            "direction": "tx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 5,
            "name": "io_sensor_in",
            "direction": "rx",
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
                "default": 100,
                "values": [
                  100,
                  200,
                  400
                ]
              },
              "samprt_percent_accuracy": 5,
              "nb_channels": {
                "type": "int",
                "default": 1,
                "values": [
                  1,
                  2,
                  3,
                  4
                ]
              }
            }
          },
          {
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 9,
            "name": "io_timer",
            "direction": "rx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 11,
            "name": "io_ui_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 15,
            "name": "io_ui_out",
            "direction": "tx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 19,
            "name": "io_serial_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 21,
            "name": "io_analog_in",
            "direction": "tx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 23,
            "name": "io_audio_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 26,
            "name": "io_audio_out",
            "direction": "tx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 30,
            "name": "io_2d_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
        ]
      },
      {
        "instance": "BACKGROUND",
        "index": 1,
        "archID": "armv6m",
        "procID": 0,
        "priority": 1,
        "trace_depth": 256,
        "trace_verbosity": 2
      }
    ]
  },
  "Nuvoton_M5531": {
    "platform": "Nuvoton_M5531",
    "version": 1,
    "description": "Nuvoton M5531",
    "file_paths": [
      {
        "path_to": "node_manifest_arm",
        "index": 0,
        "path": "../manifests"
      },
      {
        "path_to": "node_manifest_sigp",
        "index": 1,
        "path": "../manifests"
      }
    ],
    "processors": [
      {
        "processor": null,
        "archID": "armv7m",
        "procID": 0,
        "nodes": [
          {
            "node": null,
            "path": 0,
            "index": 1,
            "name": "arm_script"
          },
          {
            "node": null,
            "path": 0,
            "index": 2,
            "name": "arm_filter"
          },
          {
            "node": null,
            "path": 0,
            "index": 3,
            "name": "arm_converter"
          },
          {
            "node": null,
            "path": 0,
            "index": 4,
            "name": "bb_jpegenc"
          },
          {
            "node": null,
            "path": 0,
            "index": 5,
            "name": "eml_tjpgdec"
          }
        ]
      },
      {
        "processor": null,
        "archID": "armv7m",
        "procID": 0,
        "nodes": [
          {
            "node": null,
            "path": 0,
            "index": 2,
            "name": "sigp_filter2D"
          }
        ]
      }
    ],
    "memories": [
      {
        "memory": "shared",
        "index": 0,
        "size": 8000,
        "access": 0,
        "speed": 0,
        "type": 0,
        "instance": -1
      },
      {
        "memory": "SRAM",
        "index": 1,
        "size": 8000,
        "access": 0,
        "speed": 0,
        "type": 0,
        "subblocks": [
          {
            "subblock": null,
            "index": 0,
            "name": "sram1",
            "base": 0,
            "size": 1014
          },
          {
            "subblock": null,
            "index": 1,
            "name": "sram2",
            "base": 1024,
            "size": 1014
          }
        ],
        "instance": -1
      },
      {
        "memory": "RET",
        "index": 2,
        "size": 80,
        "access": 0,
        "speed": 0,
        "type": 1,
        "instance": -1
      },
      {
        "memory": "private0",
        "index": 3,
        "size": 8000,
        "speed": 2,
        "instance": 0
      },
      {
        "memory": "private1",
        "index": 4,
        "size": 80,
        "instance": 1
      }
    ],
    "interpreter_instances": [
      {
        "instance": "MAIN",
        "index": 0,
        "archID": "armv7m",
        "procID": 0,
        "priority": 1,
        "trace_depth": 256,
        "trace_verbosity": 2,
        "memory_isolation": 1,
        "interfaces": [
          {
            "interface": null,
            "index": 0,
            "c_platform_index": 0,
            "name": "io_data_sink",
            "direction": "tx",
            "domain": "general"
          },
          {
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 1,
            "name": "io_data_in",
            "direction": "rx",
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
                "default": 48000,
                "values": [
                  8000,
                  16000,
                  48000
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
            "interface": null,
            "path": 1,
            "index": 1,
            "c_platform_index": 2,
            "name": "io_data_in",
            "direction": "rx",
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
                "default": 22050,
                "values": [
                  8000,
                  16000,
                  22050
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 3,
            "name": "io_data_out",
            "direction": "tx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 1,
            "c_platform_index": 4,
            "name": "io_data_out",
            "direction": "tx",
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
                "default": 96000,
                "values": [
                  16000,
                  16000,
                  96000
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
        ]
      },
      {
        "instance": "BACKGROUND",
        "index": 1,
        "archID": "armv6m",
        "procID": 0,
        "priority": 1,
        "trace_depth": 256,
        "trace_verbosity": 2
      }
    ]
  },
  "Nuvoton_M55M1": {
    "platform": "Nuvoton_M55M1",
    "version": 1,
    "description": "Nuvoton M55M1",
    "file_paths": [
      {
        "path_to": "node_manifest_arm",
        "index": 0,
        "path": "../manifests"
      },
      {
        "path_to": "node_manifest_sigp",
        "index": 1,
        "path": "../manifests"
      }
    ],
    "processors": [
      {
        "processor": null,
        "archID": "armv7m",
        "procID": 0,
        "nodes": [
          {
            "node": null,
            "path": 0,
            "index": 1,
            "name": "arm_script"
          },
          {
            "node": null,
            "path": 0,
            "index": 2,
            "name": "arm_filter"
          },
          {
            "node": null,
            "path": 0,
            "index": 3,
            "name": "arm_converter"
          },
          {
            "node": null,
            "path": 0,
            "index": 4,
            "name": "bb_jpegenc"
          },
          {
            "node": null,
            "path": 0,
            "index": 5,
            "name": "eml_tjpgdec"
          },
          {
            "node": null,
            "path": 0,
            "index": 6,
            "name": "sigp_amplifier"
          },
          {
            "node": null,
            "path": 0,
            "index": 7,
            "name": "sigp_modulator"
          },
          {
            "node": null,
            "path": 0,
            "index": 8,
            "name": "sigp_demodulator"
          },
          {
            "node": null,
            "path": 0,
            "index": 15,
            "name": "sigp_router"
          }
        ]
      },
      {
        "processor": null,
        "archID": "armv7m",
        "procID": 0,
        "nodes": [
          {
            "node": null,
            "path": 0,
            "index": 2,
            "name": "sigp_filter2D"
          }
        ]
      }
    ],
    "memories": [
      {
        "memory": "shared",
        "index": 0,
        "size": 8000,
        "access": 0,
        "speed": 0,
        "type": 0,
        "instance": -1
      },
      {
        "memory": "SRAM",
        "index": 1,
        "size": 8000,
        "access": 0,
        "speed": 0,
        "type": 0,
        "subblocks": [
          {
            "subblock": null,
            "index": 0,
            "name": "sram1",
            "base": 0,
            "size": 1014
          },
          {
            "subblock": null,
            "index": 1,
            "name": "sram2",
            "base": 1024,
            "size": 1014
          }
        ],
        "instance": -1
      },
      {
        "memory": "RET",
        "index": 2,
        "size": 80,
        "access": 0,
        "speed": 0,
        "type": 1,
        "instance": -1
      },
      {
        "memory": "private0",
        "index": 3,
        "size": 8000,
        "speed": 2,
        "instance": 0
      },
      {
        "memory": "private1",
        "index": 4,
        "size": 80,
        "instance": 1
      }
    ],
    "interpreter_instances": [
      {
        "instance": "MAIN",
        "index": 0,
        "archID": "armv7m",
        "procID": 0,
        "priority": 1,
        "trace_depth": 256,
        "trace_verbosity": 2,
        "memory_isolation": 1,
        "interfaces": [
          {
            "interface": null,
            "index": 0,
            "c_platform_index": 0,
            "name": "io_data_sink",
            "direction": "tx",
            "domain": "general"
          },
          {
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 1,
            "name": "io_data_in",
            "direction": "rx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 1,
            "c_platform_index": 2,
            "name": "io_data_in",
            "direction": "rx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 3,
            "name": "io_data_out",
            "direction": "tx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 1,
            "c_platform_index": 4,
            "name": "io_data_out",
            "direction": "tx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 5,
            "name": "io_sensor_in",
            "direction": "rx",
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
                "default": 100,
                "values": [
                  100,
                  200,
                  400
                ]
              },
              "samprt_percent_accuracy": 5,
              "nb_channels": {
                "type": "int",
                "default": 1,
                "values": [
                  1,
                  2,
                  3,
                  4
                ]
              }
            }
          },
          {
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 9,
            "name": "io_timer",
            "direction": "rx",
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
                "default": 44100,
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 11,
            "name": "io_ui_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 15,
            "name": "io_ui_out",
            "direction": "tx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 19,
            "name": "io_serial_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 21,
            "name": "io_analog_in",
            "direction": "tx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 23,
            "name": "io_audio_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 26,
            "name": "io_audio_out",
            "direction": "tx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
            "interface": null,
            "path": 1,
            "index": 0,
            "c_platform_index": 30,
            "name": "io_2d_in",
            "direction": "rx",
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
                "default": 1,
                "values": [
                  1,
                  10,
                  100
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
        ]
      },
      {
        "instance": "BACKGROUND",
        "index": 1,
        "archID": "armv6m",
        "procID": 0,
        "priority": 1,
        "trace_depth": 256,
        "trace_verbosity": 2
      }
    ]
  }
};
