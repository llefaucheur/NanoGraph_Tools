/* ----------------------------------------------------------------------
 * Project:      CMSIS Stream Tools
 * Title:        main.c
 * Description:  
 *
 * $Date:        15 February 2023
 * $Revision:    V0.0.1
 * -------------------------------------------------------------------- */
/*
 * Copyright (C) 2010-2023 ARM Limited or its affiliates. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the License); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an AS IS BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

#include <stdint.h>
#include <stdio.h>

#include "../nanograph_common_included_in_tools.h"
#include "../nanograph_interpreter_included_in_tools.h"

#include "nanograph_tool_define.h"
#include "nanograph_tool_types.h"
#include "nanograph_tool_include.h"

#include "yaml_platform.h"
#include "yaml_graph.h"
#include "yaml_node.h"


#if 1

YP_PlatformManifest m;
YG_Graph g;


extern int yp_read_file(const char* filename, YP_PlatformManifest* m);
extern void arm_nanograph_read_graph(struct nanograph_platform_manifest* platform, struct nanograph_graph_linkedlist* graph, char* ggraph_txt);
extern void arm_nanograph_read_GUI(struct nanograph_platform_manifest* platform, struct nanograph_graph_linkedlist* graph, char* ggraph_gui, FILE* ggraph_txt_result);
extern void arm_nanograph_graphTxt2Bin(struct nanograph_platform_manifest* platform, struct nanograph_graph_linkedlist* graph, char* ggraph_source);

static const char* yg_test_kind(YG_ItemKind kind)
{
    return (kind == YG_ITEM_IO) ? "IO" : "node";
}

/**
  @brief            (main)
  @param[in/out]    none
  @return           int

  @par              translates the graph intermediate format GraphTxt to GraphBin to be reused
                    in CMSIS-Stream/nanograph_graph/*.txt
  @remark
 */

int main(int argc, char* argv[])
{
    const char* platform_filename;
    const char* graph_filename;
    int rc;
    int i;
    int j;
    struct nanograph_platform_manifest* platform;
    struct nanograph_graph_linkedlist* graph;

    /* ---------------------------------------------------- */

    platform_filename = (argc > 2) ? argv[1] : "platform.yaml";
    graph_filename = (argc > 2) ? argv[2] : "graph.yaml";

    rc = yp_read_file(platform_filename, &m);
    if (rc != YP_OK)
    {
        fprintf(stderr, "parse error %d, line %d: %s\n",
            rc, m.error_line, m.error_text);
        return 1;
    }

    /* ---------------------------------------------------- */

    printf("platform: %s version=%d\n", m.platform, m.version);
    printf("file_paths: %d\n", m.file_path_count);
    i = 0;
    while (i < m.file_path_count)
    {
        printf("  [%d] %s index=%d path=%s\n", i,
            m.file_path[i].path_to, m.file_path[i].index,
            m.file_path[i].path);
        ++i;
    }
    printf("processors: %d\n", m.processor_count);
    i = 0;
    while (i < m.processor_count)
    {
        printf("  [%d] archID=%s procID=%d nodes=%d\n", i,
            m.processor[i].archID, m.processor[i].procID,
            m.processor[i].node_count);
        j = 0;
        while (j < m.processor[i].node_count)
        {
            printf("       node[%d] path=%d index=%d name=%s\n", j,
                m.processor[i].node[j].path,
                m.processor[i].node[j].index,
                m.processor[i].node[j].name);
            ++j;
        }
        ++i;
    }
    printf("memories: %d\n", m.memory_count);
    i = 0;
    while (i < m.memory_count)
    {
        printf("  [%d] %s index=%d size=%lu subblocks=%d interpreter_instance %d\n", i,
            m.memory[i].name, m.memory[i].index, m.memory[i].size,
            m.memory[i].subblock_count, m.memory[i].interpreter_instance);
        ++i;
    }
    printf("interpreter_instances: %d\n", m.instance_count);
    i = 0;
    while (i < m.instance_count)
    {
        printf("  [%d] %s archID=%s procID=%d interfaces=%d\n", i,
            m.instance[i].name, m.instance[i].archID,
            m.instance[i].procID, m.instance[i].interface_count);
        j = 0;
        while (j < m.instance[i].interface_count)
        {
            const YP_Interface* itf;
            itf = &m.instance[i].interface[j];
            printf("       interface[%d] %s[%d] c_platform_index=%d direction=%s domain=%s",
                j, itf->name, itf->index, itf->c_platform_index,
                itf->direction, itf->domain);
            if (itf->format.sample_rate.present & YP_NUM_HAS_DEFAULT)
                printf(" sample_rate_default=%g", itf->format.sample_rate.default_value);
            printf("\n");
            ++j;
        }
        ++i;
    }

    printf("\n-----------------------------------------\n");

    /* --------------------COPY TO INTERNAL ------------- */

    {
        extern void copy_manifest_yaml2C(YP_PlatformManifest *yaml, struct nanograph_platform_manifest *platform);

        if (0 == (platform = calloc(sizeof(struct nanograph_platform_manifest), 1))) { printf("\n init error \n"); exit(1); }

        copy_manifest_yaml2C(&m, platform);
    }

    /* ---------------------------------------------------- */
    
    rc = yg_read_file(graph_filename, &g);
    if (rc != YG_OK)
    {
        fprintf(stderr, "parse error %d, line %d: %s\n",
            rc, g.error_line, g.error_text);
        return 1;
    }

    printf("platform: %s\n", (g.present & YG_GRAPH_HAS_PLATFORM) ? g.platform : "<none>");
    printf("nodes: %d\n", g.nb_nodes);
    i = 0;
    while (i < g.nb_nodes)
    {
        const YG_Node* n;
        n = &g.nodes[i];
        printf("  [%d] %s %s\n", i, yg_test_kind(n->kind), n->name);
        printf("       scope=%s local=%s base=%s instance=%d depth=%d\n",
            n->scope, n->local_name, n->base_name,
            n->instance_index, n->hierarchy_depth);
        if (n->present & YG_NODE_HAS_FRAMEL) printf("       framel=%d\n", n->framel);
        if (n->present & YG_NODE_HAS_DOMAIN) printf("       domain=%s\n", n->domain);
        if (n->present & YG_NODE_HAS_NBCHAN) printf("       nbchan=%d\n", n->nbchan);
        if (n->present & YG_NODE_HAS_SAMPRT) printf("       samprt=%g\n", n->samprt);
        if (n->present & YG_NODE_HAS_DATA_TYPE) printf("       data_type=%s\n", n->data_type);
        if (n->present & YG_NODE_HAS_MINOPP) printf("       minopp=%d\n", n->minopp);
        j = 0;
        while (j < n->nb_named_parameters)
        {
            printf("       parameter %s=%s\n",
                n->named_parameter[j].name, n->named_parameter[j].value);
            ++j;
        }
        ++i;
    }

    printf("arcs: %d\n", g.nb_arcs);
    i = 0;
    while (i < g.nb_arcs)
    {
        const YG_Arc* a;
        a = &g.arcs[i];
        printf("  [%d] OPort_%d %s %s -> IPort_%d %s %s\n",
            i, a->source.port, yg_test_kind(a->source.kind), a->source.name,
            a->destination.port, yg_test_kind(a->destination.kind), a->destination.name);
        if (a->present & YG_ARC_HAS_NAME) printf("       arc_name=%s\n", a->arc_name);
        if (a->present & YG_ARC_HAS_BUFFER_SIZE) printf("       buffer_size=%d\n", a->buffer_size);
        if (a->present & YG_ARC_HAS_DATA_TYPE) printf("       data_type=%s\n", a->data_type);
        if (a->present & YG_ARC_HAS_SAMPLE_RATE) printf("       sample_rate=%g\n", a->sample_rate);
        if (a->present & YG_ARC_HAS_NB_CHANNELS) printf("       nb_channels=%d\n", a->nb_channels);
        if (a->present & YG_ARC_HAS_INTERLEAVING) printf("       interleaving=%s\n", a->interleaving);
        if (a->present & YG_ARC_HAS_OVERLAY_WITH) printf("       overlay_with=%s\n", a->overlay_with);
        if (a->present & YG_ARC_HAS_FORMAT_ID) printf("       formatID=%s\n", a->format_id);
        ++i;
    }

    printf("formats: %d\n", g.nb_formats);
    i = 0;
    while (i < g.nb_formats)
    {
        const YG_Format* fmt;
        fmt = &g.formats[i];
        printf("  [%d] formatID=%d", i, fmt->format_id);
        if (fmt->present & YG_FORMAT_HAS_DATA_TYPE) printf(" data_type=%s", fmt->data_type);
        if (fmt->present & YG_FORMAT_HAS_SAMPLE_RATE) printf(" sample_rate=%g", fmt->sample_rate);
        if (fmt->present & YG_FORMAT_HAS_NB_CHANNELS) printf(" nb_channels=%d", fmt->nb_channels);
        if (fmt->present & YG_FORMAT_HAS_INTERLEAVING) printf(" interleaving=%s", fmt->interleaving);
        printf("\n");
        ++i;
    }

    /* --------------------COPY TO INTERNAL ------------- */

    {
        extern void copy_graph_yaml2C(YG_Graph* yaml, struct nanograph_graph_linkedlist* graph);

        if (0 == (graph = calloc(sizeof(struct nanograph_graph_linkedlist), 1))) { printf("\n init error \n"); exit(1); }

        copy_graph_yaml2C(&g, graph);
    }

    /* --------------------BUILD THE BINARY GRAPH -------------- */


    return 0;
}

#else
extern void arm_nanograph_read_manifests (struct nanograph_platform_manifest *platform, char *all_files);
extern void arm_nanograph_read_graph(struct nanograph_platform_manifest* platform, struct nanograph_graph_linkedlist* graph, char* ggraph_txt);
extern void arm_nanograph_read_GUI(struct nanograph_platform_manifest* platform, struct nanograph_graph_linkedlist* graph, char* ggraph_gui, FILE * ggraph_txt_result);
extern void arm_nanograph_graphTxt2Bin (struct nanograph_platform_manifest *platform, struct nanograph_graph_linkedlist *graph, char* ggraph_source);

/**
  @brief            (main) 
  @param[in/out]    none
  @return           int

  @par              translates the graph intermediate format GraphTxt to GraphBin to be reused
                    in CMSIS-Stream/nanograph_graph/*.txt
  @remark
 */

void main(int argc, char* argv[])
{
    char * pt_line, found_manifest_file, found_gui_file;

    struct nanograph_platform_manifest *platform;
    struct nanograph_graph_linkedlist *graph;
#define GRAPH_HEADER        "header.h"         /* list of labels to do "set_parameter" from scripts */
#define GRAPH_DEBUG         "debug.txt"        /* comments made during graph conversion  */

    char ARG_PARAM[MAXINPUT], tag[NBCHAR_LINE], file_name[NBCHAR_LINE], file_nameGUI[NBCHAR_LINE];
    char MANIFEST [MAXINPUT];
    char GRAPH_GUI[MAXINPUT];
    char GRAPH_TXT[MAXINPUT], graph_file_name[NBCHAR_LINE];
    char GRAPH_BIN[MAXINPUT], binary_file_name[NBCHAR_LINE];

    /* read the command file (the list of files used for the compilation) */
    read_input_file(argv[1], ARG_PARAM);
    pt_line = ARG_PARAM;
    found_gui_file = found_manifest_file = 0;

    jump2next_valid_line(&pt_line);
    while (found_manifest_file == 0)
    {
        fields_extract(&pt_line, "cc", tag, file_name);
        if (0 == strcmp("GUI", tag)) { strcpy(file_nameGUI, file_name);  read_input_file(file_nameGUI, GRAPH_GUI); found_gui_file = 1;}
        if (0 == strcmp("GRAPH", tag)) { strcpy(graph_file_name, file_name);  }
        if (0 == strcmp("COMPILED", tag)) { strcpy(binary_file_name, file_name); }
        if (0 == strcmp("MANIFEST", tag)) { read_input_file(file_name, MANIFEST); found_manifest_file = 1; }
        if (globalEndFile == FOUND_END_OF_FILE) break;
    }
    globalEndFile = 0;
    if (0 == (platform = calloc(sizeof(struct nanograph_platform_manifest), 1))) { printf("\n init error \n"); exit(1); }
    if (0 == (graph = calloc(sizeof(struct nanograph_graph_linkedlist), 1))) { printf("\n init error \n"); exit(1); }

    /* 
        Read the file names : 
        platform manifest
        stream io manifests
        nodes manifests
    */
    memset(platform, 0, sizeof(struct nanograph_platform_manifest));
    memset(graph, 0, sizeof(struct nanograph_graph_linkedlist));

    /* initialize default values */
    {   uint32_t i;
        for (i = 0; i < MAX_NB_ARCS; i++)
        {   struct arcStruct* arc;

            arc = &(graph->arc[i]);
            arc->commander0_servant1 = 1;
            arc->IO_FMT_manifest.nchan = 1;
            arc->IO_FMT_manifest.frame_length_bytes = 4;

            arc = &(platform->IO_arc[i]);
            arc->commander0_servant1 = 1;
            arc->IO_FMT_manifest.nchan = 1;
            arc->IO_FMT_manifest.frame_length_bytes = 4;
        }
        for (i = 0; i < MAX_NB_FORMAT; i++)
        {
            struct formatStruct* format;
            format = &(graph->arcFormat[i]);
            format->nchan = 1;
            format->frame_length_bytes = 1;
        }
    }

    system("cd ");

    if (0 == (graph->ptf_graph_bin = fopen(binary_file_name, "wt"))) { printf("\n init error %s \n", GRAPH_BIN); exit(1); }
    if (0 == (graph->ptf_header = fopen(GRAPH_HEADER, "wt"))) {  printf (  "\n init error %s \n", GRAPH_HEADER); exit( 1); }
    if (0 == (graph->ptf_debug = fopen(GRAPH_DEBUG, "wt"))) {  printf (  "\n init error %s\n", GRAPH_DEBUG); exit( 1); }

    arm_nanograph_read_manifests(platform, MANIFEST);
   
    /*
        read the GRAPH, compile the scripts
        cumulate SRAM needs (static/working/graph size) 
        list of formats, warn for the need SWC converters

        graph format structure = 
            IO mapping and debug arcs
            Nodes : instanceID, indexed memory banks, debug info, default processors/arch, 
                parameter preset/size/tags, list of arcs/streaming-arcs
            Scripts code
            memory banks size accumulators, physical address, speed
            digital platform : processors ID/arch/IO-affinity
                domain ios, fwioIDX, platform name
            list of arcs: buffer memory bank (base,size), debug, node src/dst +arc idx

            PACK data to 32bits
    */
    
    if (found_gui_file)
    {
        FILE* ptf_graph_txt;
        printf("\n-----------------\n\n %s => %s\n\n-----------------\n", file_nameGUI, graph_file_name);
        if (0 == (ptf_graph_txt = fopen(graph_file_name, "wt"))) { exit(-1); };

        arm_nanograph_read_GUI(platform, graph, GRAPH_GUI, ptf_graph_txt);
        fclose(ptf_graph_txt);
    }

    printf("\n-----------------\n\n %s \n\n-----------------\n", graph_file_name);
    read_input_file(graph_file_name, GRAPH_TXT);
    arm_nanograph_read_graph(platform, graph, GRAPH_TXT);

    /*@@@  TODO
       check consistency : formats between nodes/arcs 
       to help the graph designer insert conversion nodes
        - ARCS : does { struct options raw_format_options } matches with { struct formatStruct format; }
        - NODES : does { struct options raw_format_options } matches with { struct arcStruct arc[MAX_NB_NANOGRAPH_PER_NODE].format; }
         arm_nanograph_check_graph(platform, graph); 
       
      @@@  TODO 
       generate the debug TXT file and header used to address nodes in the binary graph,
       header with a declaration arc ID and arc names
       
         arm_nanograph_print_graph(platform, graph); 
      
        check format compatibility to tell the graph programmer to insert conversion nodes
        remove formats declared twice 
      
        Convert the structure to the binary format
            used by the graph interpreter and scheduler
    */
    {  if (0 == (graph->ptf_graph_bin = fopen(binary_file_name, "wt"))) exit( 1);

        arm_nanograph_graphTxt2Bin(platform, graph, graph_file_name);

        fclose(graph->ptf_graph_bin);

    }

    printf (  "\n graph compilation done \n");
    exit( 3); 
}
#endif
