#ifndef YAML_NODE_H
#define YAML_NODE_H

/*
 * yaml_node.h
 *
 * Small, self-contained reader for NanoGraph node-manifest YAML files.
 * It parses the restricted YAML subset used by the NanoGraph manifests;
 * it is intentionally not a general-purpose YAML parser.
 *
 * C90/C89 compatible, no heap allocation.
 */

#define YN_MAX_NAME             64
#define YN_MAX_TEXT            256
#define YN_MAX_PATH            128
#define YN_MAX_VALUE            64
#define YN_MAX_PORTS            16
#define YN_MAX_FORMATS          16
#define YN_MAX_PARAMETERS       32
#define YN_MAX_VALUES           32
#define YN_MAX_MEMORY_BANKS     16
#define YN_MAX_ARCH             128
#define YN_MAX_LINE            512

#define YN_OK                    0
#define YN_ERR_OPEN             -1
#define YN_ERR_SYNTAX           -2
#define YN_ERR_LINE_TOO_LONG    -3
#define YN_ERR_TOO_MANY         -4
#define YN_ERR_BAD_NUMBER       -5

/* Generic value used for enum/string arrays such as [int16, float32]. */
typedef struct
{
    int count;
    char value[YN_MAX_VALUES][YN_MAX_VALUE];
} YN_StringList;

typedef struct
{
    int count;
    double value[YN_MAX_VALUES];
} YN_NumberList;

typedef struct
{
    char name[YN_MAX_NAME];
    int index;
    char format[YN_MAX_NAME];
    char domain[YN_MAX_VALUE];
    int buffer_overlay;
    unsigned long present;
} YN_Port;

#define YN_PORT_HAS_INDEX          0x0001UL
#define YN_PORT_HAS_FORMAT         0x0002UL
#define YN_PORT_HAS_OVERLAY        0x0004UL
#define YN_PORT_HAS_DOMAIN         0x0008UL

typedef struct
{
    char name[YN_MAX_NAME];
    char interleaving[YN_MAX_VALUE];

    char data_type[YN_MAX_VALUE];
    char data_type_default[YN_MAX_VALUE];
    YN_StringList data_type_values;

    int frame_length_default;
    YN_NumberList frame_length_values;

    char sample_rate_type[YN_MAX_VALUE];
    double sample_rate_default;
    YN_NumberList sample_rate_values;
    double sample_rate_accuracy;

    int nb_channels_default;
    YN_NumberList nb_channels_values;
    int nb_channels_min;
    int nb_channels_max;

    int consume_min;
    int consume_max;
    int produce_min;
    int produce_max;

    char unit[YN_MAX_VALUE];
    double unit_scale;

    /* Optional relationship to another interface format.
     * Example YAML:
     *   same_as:
     *     interface: rx
     *     index: 0
     */
    char same_as_interface[YN_MAX_VALUE];
    int same_as_index;

    unsigned long present;
} YN_Format;

#define YN_FMT_HAS_INTERLEAVING       0x00000001UL
#define YN_FMT_HAS_DATA_TYPE          0x00000002UL
#define YN_FMT_HAS_DATA_TYPE_DEFAULT  0x00000004UL
#define YN_FMT_HAS_DATA_TYPE_VALUES   0x00000008UL
#define YN_FMT_HAS_FRAME_DEFAULT      0x00000010UL
#define YN_FMT_HAS_FRAME_VALUES       0x00000020UL
#define YN_FMT_HAS_RATE_TYPE          0x00000040UL
#define YN_FMT_HAS_RATE_DEFAULT       0x00000080UL
#define YN_FMT_HAS_RATE_VALUES        0x00000100UL
#define YN_FMT_HAS_RATE_ACCURACY      0x00000200UL
#define YN_FMT_HAS_CHANNEL_DEFAULT    0x00000400UL
#define YN_FMT_HAS_CHANNEL_VALUES     0x00000800UL
#define YN_FMT_HAS_CHANNEL_MIN        0x00001000UL
#define YN_FMT_HAS_CHANNEL_MAX        0x00002000UL
#define YN_FMT_HAS_CONSUME_MIN        0x00004000UL
#define YN_FMT_HAS_CONSUME_MAX        0x00008000UL
#define YN_FMT_HAS_PRODUCE_MIN        0x00010000UL
#define YN_FMT_HAS_PRODUCE_MAX        0x00020000UL
#define YN_FMT_HAS_UNIT               0x00040000UL
#define YN_FMT_HAS_UNIT_SCALE         0x00080000UL
#define YN_FMT_HAS_SAME_AS_INTERFACE  0x00100000UL
#define YN_FMT_HAS_SAME_AS_INDEX      0x00200000UL

typedef struct
{
    char name[YN_MAX_NAME];
    char type[YN_MAX_VALUE];
    char default_value[YN_MAX_VALUE];
    YN_StringList values;
    double min_value;
    double max_value;
    char unit[YN_MAX_VALUE];
    char help[YN_MAX_TEXT];
    unsigned long present;
} YN_Parameter;

#define YN_PARAM_HAS_TYPE       0x0001UL
#define YN_PARAM_HAS_DEFAULT    0x0002UL
#define YN_PARAM_HAS_VALUES     0x0004UL
#define YN_PARAM_HAS_MIN        0x0008UL
#define YN_PARAM_HAS_MAX        0x0010UL
#define YN_PARAM_HAS_UNIT       0x0020UL
#define YN_PARAM_HAS_HELP       0x0040UL

typedef struct
{
    char section[YN_MAX_NAME];
    int index;
    int mreloc;
    int mclear;
    int mdata0prog1;
    char mtype[YN_MAX_VALUE];
    char mspeed[YN_MAX_VALUE];
    int malloc_a;
    int malloc_b;
    int malloc_b_type;
    int malloc_b_arc;
    int malloc_c;
    int malloc_c_arc;
    int malloc_d;
    int malloc_d_arc;
    char format[YN_MAX_NAME];
    unsigned long present;
} YN_MemoryBank;

#define YN_MEM_HAS_INDEX          0x00000001UL
#define YN_MEM_HAS_mreloc    0x00000002UL
#define YN_MEM_HAS_CLEAR          0x00000004UL
#define YN_MEM_HAS_DATA0PROG1     0x00000008UL
#define YN_MEM_HAS_TYPE           0x00000020UL
#define YN_MEM_HAS_SPEED          0x00000040UL
#define YN_MEM_HAS_ALLOC_A        0x00000080UL
#define YN_MEM_HAS_ALLOC_B        0x00000100UL
#define YN_MEM_HAS_ALLOC_B_TYPE   0x00000200UL
#define YN_MEM_HAS_ALLOC_B_ARC    0x00000400UL
#define YN_MEM_HAS_ALLOC_C        0x00000800UL
#define YN_MEM_HAS_ALLOC_C_ARC    0x00001000UL
#define YN_MEM_HAS_ALLOC_D        0x00002000UL
#define YN_MEM_HAS_ALLOC_D_ARC    0x00004000UL
#define YN_MEM_HAS_FORMAT         0x00008000UL

typedef struct
{
    char language[YN_MAX_VALUE];
    double complexity;
    char header[YN_MAX_PATH];
    char init[YN_MAX_NAME];
    char process[YN_MAX_NAME];
    char processor_architecture[YN_MAX_ARCH];
    char processor_fpu_option[YN_MAX_VALUE];
    char malloc_mode[YN_MAX_VALUE];
    char reentrant[YN_MAX_VALUE];
    int compatibility;
    int nb_memory_banks;
    int library;

    int memory_bank_count;
    YN_MemoryBank memory_bank[YN_MAX_MEMORY_BANKS];
    unsigned long present;
} YN_Implementation;

#define YN_IMPL_HAS_LANGUAGE       0x0001UL
#define YN_IMPL_HAS_COMPLEXITY     0x0002UL
#define YN_IMPL_HAS_HEADER         0x0004UL
#define YN_IMPL_HAS_INIT           0x0008UL
#define YN_IMPL_HAS_PROCESS        0x0010UL
#define YN_IMPL_HAS_ARCH           0x0020UL
#define YN_IMPL_HAS_FPU            0x0040UL
#define YN_IMPL_HAS_MALLOC         0x0080UL
#define YN_IMPL_HAS_REENTRANT      0x0100UL
#define YN_IMPL_HAS_COMPATIBILITY  0x0200UL
#define YN_IMPL_HAS_NB_BANKS       0x0400UL
#define YN_IMPL_HAS_LIBRARY        0x0800UL

typedef struct
{
    char node[YN_MAX_NAME];
    char node_designer[YN_MAX_NAME];
    int version;
    char description[YN_MAX_TEXT];

    int nb_input;
    int nb_output;
    int input_count;
    int output_count;
    YN_Port input[YN_MAX_PORTS];
    YN_Port output[YN_MAX_PORTS];

    int format_count;
    YN_Format format[YN_MAX_FORMATS];

    int parameter_count;
    YN_Parameter parameter[YN_MAX_PARAMETERS];

    char activation_key[YN_MAX_VALUE];
    YN_Implementation implementation;

    unsigned long present;
    int error_line;
    char error_text[YN_MAX_TEXT];
} YN_NodeManifest;

#define YN_NODE_HAS_DESIGNER       0x0001UL
#define YN_NODE_HAS_VERSION        0x0002UL
#define YN_NODE_HAS_DESCRIPTION    0x0004UL
#define YN_NODE_HAS_NB_INPUT       0x0008UL
#define YN_NODE_HAS_NB_OUTPUT      0x0010UL
#define YN_NODE_HAS_ACTIVATION     0x0020UL

#ifdef __cplusplus
extern "C" {
#endif

int yn_read_file(const char *filename, YN_NodeManifest *manifest);
const YN_Format *yn_find_format(const YN_NodeManifest *manifest, const char *name);
const YN_Parameter *yn_find_parameter(const YN_NodeManifest *manifest, const char *name);

#ifdef __cplusplus
}
#endif

#endif
