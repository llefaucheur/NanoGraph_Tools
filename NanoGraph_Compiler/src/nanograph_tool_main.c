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

extern void arm_nanograph_read_manifests (struct nanograph_platform_manifest *platform, char *all_files);
extern void arm_nanograph_read_graph(struct nanograph_platform_manifest* platform,struct nanograph_graph_linkedlist *graph, char* ggraph_txt);
extern void arm_nanograph_graphTxt2Bin (struct nanograph_platform_manifest *platform, struct nanograph_graph_linkedlist *graph, FILE *ptf_graph_bin, char* ggraph_source);

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
    char *all_files, *ggraph;

    struct nanograph_platform_manifest *platform;
    struct nanograph_graph_linkedlist *graph;
#define GRAPH_HEADER        "header.h"         /* list of labels to do "set_parameter" from scripts */
#define GRAPH_DEBUG         "debug.txt"        /* comments made during graph conversion  */
    FILE *commands;
    //char GRAPH_PATH[MAXINPUT];
    //char SYSTEM[MAXINPUT];
    char GRAPH_TXT[MAXINPUT];
    char GRAPH_BIN[MAXINPUT];
    char GRAPH_TOP_MANIFEST[MAXINPUT];

    commands = fopen(argv[1], "rt");

    //fscanf(commands, "%s", GRAPH_PATH);
    //sprintf(SYSTEM, "cd %s \n", GRAPH_PATH);
    //system(SYSTEM);

    fscanf(commands, "%s", GRAPH_TXT);
    fscanf(commands, "%s", GRAPH_BIN);
    fscanf(commands, "%s", GRAPH_TOP_MANIFEST);
    fclose(commands);

    if (0 == (all_files = calloc(MAXINPUT, 1))) { printf("\n init error calloc \n"); }
    if (0 == (ggraph = calloc (MAXINPUT, 1))) {  printf ("\n init error \n"); exit( 1); }
    if (0 == (platform = calloc (sizeof(struct nanograph_platform_manifest), 1))) {  printf ("\n init error \n"); exit( 1); }
    if (0 == (graph = calloc (sizeof(struct nanograph_graph_linkedlist), 1))) {  printf ("\n init error \n"); exit( 1); }

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
            arc->IO_FMT_manifest.frame_length_bytes = 1;
            arc = &(platform->IO_arc[i]);
            arc->commander0_servant1 = 1;
            arc->IO_FMT_manifest.nchan = 1;
            arc->IO_FMT_manifest.frame_length_bytes = 1;
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

    if (0 == (graph->ptf_graph_bin = fopen(GRAPH_BIN, "wt"))) { printf("\n init error %s \n", GRAPH_BIN); exit(1); }
    if (0 == (graph->ptf_header = fopen(GRAPH_HEADER, "wt"))) {  printf (  "\n init error %s \n", GRAPH_HEADER); exit( 1); }
    if (0 == (graph->ptf_debug = fopen(GRAPH_DEBUG, "wt"))) {  printf (  "\n init error %s\n", GRAPH_DEBUG); exit( 1); }

;

    read_input_file (GRAPH_TOP_MANIFEST, all_files);
    arm_nanograph_read_manifests(platform, all_files);
    
    
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
    
    printf ("\n-----------------\n\n %s \n\n-----------------\n", GRAPH_TXT);
    read_input_file (GRAPH_TXT, ggraph);
    arm_nanograph_read_graph(platform, graph, ggraph);

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
    {   FILE * ptf_graph_bin;

        if (0 == (ptf_graph_bin = fopen(GRAPH_BIN, "wt"))) exit( 1);

        arm_nanograph_graphTxt2Bin(platform, graph, ptf_graph_bin, GRAPH_TXT);

        fclose(ptf_graph_bin); 

    }

    printf (  "\n graph compilation done \n");
    exit( 3); 
}
