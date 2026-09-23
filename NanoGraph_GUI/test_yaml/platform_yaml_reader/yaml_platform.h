#ifndef YAML_PLATFORM_H
#define YAML_PLATFORM_H

/*
 * yaml_platform.h
 *
 * Small, self-contained reader for NanoGraph platform-manifest YAML files.
 * It parses the restricted YAML subset used by the NanoGraph platform files;
 * it is intentionally not a general-purpose YAML parser.
 *
 * C90/C89 compatible, no heap allocation.
 */

#define YP_MAX_NAME              64
#define YP_MAX_TEXT             256
#define YP_MAX_PATH             128
#define YP_MAX_VALUE             64
#define YP_MAX_LINE             512
#define YP_MAX_FILE_PATHS        16
#define YP_MAX_PROCESSORS         8
#define YP_MAX_NODES_PER_PROC    64
#define YP_MAX_MEMORIES          32
#define YP_MAX_SUBBLOCKS         16
#define YP_MAX_INSTANCES         16
#define YP_MAX_INTERFACES        32
#define YP_MAX_VALUES            32

#define YP_OK                     0
#define YP_ERR_OPEN              -1
#define YP_ERR_SYNTAX            -2
#define YP_ERR_LINE_TOO_LONG     -3
#define YP_ERR_TOO_MANY          -4
#define YP_ERR_BAD_NUMBER        -5

typedef struct
{
    int count;
    char value[YP_MAX_VALUES][YP_MAX_VALUE];
} YP_StringList;

typedef struct
{
    int count;
    double value[YP_MAX_VALUES];
} YP_NumberList;

typedef struct
{
    char path_to[YP_MAX_NAME];
    int index;
    char path[YP_MAX_PATH];
    unsigned long present;
} YP_FilePath;

#define YP_PATH_HAS_INDEX 0x01UL
#define YP_PATH_HAS_PATH  0x02UL

typedef struct
{
    int path;
    int index;
    char name[YP_MAX_NAME];
    unsigned long present;
} YP_AvailableNode;

#define YP_NODE_HAS_PATH   0x01UL
#define YP_NODE_HAS_INDEX  0x02UL

typedef struct
{
    char archID[YP_MAX_VALUE];
    int procID;
    int cacheLine;
    int computeServices;
    int node_count;
    YP_AvailableNode node[YP_MAX_NODES_PER_PROC];
    unsigned long present;
} YP_Processor;

#define YP_PROC_HAS_ARCH   0x01UL
#define YP_PROC_HAS_ID       0x02UL
#define YP_PROC_HAS_CACHELINE 0x04UL
#define YP_PROC_HAS_COMPUTE   0x08UL

typedef struct
{
    int index;
    char name[YP_MAX_NAME];
    unsigned long base;
    unsigned long size;
    unsigned long present;
} YP_Subblock;

#define YP_SUB_HAS_INDEX   0x01UL
#define YP_SUB_HAS_NAME    0x02UL
#define YP_SUB_HAS_BASE    0x04UL
#define YP_SUB_HAS_SIZE    0x08UL

typedef struct
{
    char name[YP_MAX_NAME];
    int index;
    unsigned long size;
    int access;
    int speed;
    int type;
    int instance;
    int subblock_count;
    YP_Subblock subblock[YP_MAX_SUBBLOCKS];
    unsigned long present;
} YP_Memory;

#define YP_MEM_HAS_INDEX      0x0001UL
#define YP_MEM_HAS_SIZE       0x0002UL
#define YP_MEM_HAS_ACCESS     0x0004UL
#define YP_MEM_HAS_SPEED      0x0008UL
#define YP_MEM_HAS_TYPE       0x0010UL
#define YP_MEM_HAS_INSTANCE   0x0020UL

typedef struct
{
    char default_value[YP_MAX_VALUE];
    YP_StringList values;
    unsigned long present;
} YP_DataTypeConstraint;

#define YP_DTYPE_HAS_DEFAULT  0x01UL
#define YP_DTYPE_HAS_VALUES   0x02UL

typedef struct
{
    char type[YP_MAX_VALUE];
    double default_value;
    YP_NumberList values;
    unsigned long present;
} YP_NumberConstraint;

#define YP_NUM_HAS_TYPE       0x01UL
#define YP_NUM_HAS_DEFAULT    0x02UL
#define YP_NUM_HAS_VALUES     0x04UL

typedef struct
{
    char interleaving[YP_MAX_VALUE];
    YP_DataTypeConstraint data_type;
    YP_NumberConstraint frame_length;
    YP_NumberConstraint sample_rate;
    double sample_rate_accuracy;
    YP_NumberConstraint nb_channels;
    unsigned long present;
} YP_InterfaceFormat;

#define YP_FMT_HAS_INTERLEAVING  0x01UL
#define YP_FMT_HAS_RATE_ACCURACY 0x02UL

typedef struct
{
    int path;
    int index;
    int c_platform_index;
    char name[YP_MAX_NAME];
    char direction[YP_MAX_VALUE];
    char domain[YP_MAX_VALUE];
    char protocol[YP_MAX_VALUE];
    char malloc_mode[YP_MAX_VALUE];
    char set0copy1[YP_MAX_VALUE];
    double setup_time;
    YP_InterfaceFormat format;
    unsigned long present;
} YP_Interface;

#define YP_IF_HAS_PATH        0x01UL
#define YP_IF_HAS_INDEX       0x02UL
#define YP_IF_HAS_C_PLATFORM_INDEX 0x04UL
#define YP_IF_HAS_DIRECTION        0x08UL
#define YP_IF_HAS_DOMAIN           0x10UL
#define YP_IF_HAS_PROTOCOL         0x20UL
#define YP_IF_HAS_MALLOC           0x40UL
#define YP_IF_HAS_SET0COPY1        0x80UL
#define YP_IF_HAS_SETUP_TIME       0x100UL

typedef struct
{
    char name[YP_MAX_NAME];
    int index;
    char archID[YP_MAX_VALUE];
    int procID;
    int priority;
    int trace_depth;
    int trace_verbosity;
    int memory_isolation;
    int interface_count;
    YP_Interface interface[YP_MAX_INTERFACES];
    unsigned long present;
} YP_InterpreterInstance;

#define YP_INST_HAS_INDEX       0x0001UL
#define YP_INST_HAS_ARCH        0x0002UL
#define YP_INST_HAS_PROCID      0x0004UL
#define YP_INST_HAS_PRIORITY    0x0008UL
#define YP_INST_HAS_TRACE_DEPTH 0x0010UL
#define YP_INST_HAS_TRACE_VERB  0x0020UL
#define YP_INST_HAS_ISOLATION   0x0040UL

typedef struct
{
    char platform[YP_MAX_NAME];
    int version;
    char description[YP_MAX_TEXT];

    int file_path_count;
    YP_FilePath file_path[YP_MAX_FILE_PATHS];

    int processor_count;
    YP_Processor processor[YP_MAX_PROCESSORS];

    int memory_count;
    YP_Memory memory[YP_MAX_MEMORIES];

    int instance_count;
    YP_InterpreterInstance instance[YP_MAX_INSTANCES];

    unsigned long present;
    int error_line;
    char error_text[YP_MAX_TEXT];
} YP_PlatformManifest;

#define YP_PLATFORM_HAS_VERSION      0x01UL
#define YP_PLATFORM_HAS_DESCRIPTION  0x02UL

#ifdef __cplusplus
extern "C" {
#endif

int yp_read_file(const char *filename, YP_PlatformManifest *manifest);
const YP_Processor *yp_find_processor(const YP_PlatformManifest *manifest,
                                      const char *archID, int procID);
const YP_Memory *yp_find_memory(const YP_PlatformManifest *manifest,
                                const char *name, int index);
const YP_InterpreterInstance *yp_find_instance(const YP_PlatformManifest *manifest,
                                               const char *name);
const YP_Interface *yp_find_interface(const YP_InterpreterInstance *instance,
                                      const char *name, int index);

#ifdef __cplusplus
}
#endif

#endif
