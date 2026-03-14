/* ----------------------------------------------------------------------
 * Project:      CMSIS Stream Tools
 * Title:        generic graph translation to platform specific graph
 * Description:  translates the IO domain to specifics of the platform
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

#ifdef __cplusplus
 extern "C" {
#endif

#include <stdint.h>
#include <time.h>
#include <stdio.h>

#include "../nanograph_common_included_in_tools.h"
#include "../nanograph_interpreter_included_in_tools.h"

#include "nanograph_tool_define.h"
#include "nanograph_tool_types.h"
#include "nanograph_tool_include.h"


/* avoid stack overflow */
char  ctmp1[NBCHAR_LINE], ctmp2[NBCHAR_LINE], io_or_node[NBCHAR_LINE];
char  ctmp3[NBCHAR_LINE], ctmp4[NBCHAR_LINE], io_or_node2[NBCHAR_LINE];
char  PRESET[NBCHAR_LINE], fileName[NBCHAR_LINE];
struct formatStruct FORMATS[MAX_GRAPH_NB_HW_IO];
struct nanograph_node_manifest NODES[MAX_NB_NODES];
uint32_t list_of_IO_HW[MAX_GRAPH_NB_HW_IO];




/**=================================================================================================
  @brief            (main) 
  @param[in/out]    none
  @return           int
  @par              read the graph 
  @remark
 */

void arm_nanograph_read_GUI(struct nanograph_platform_manifest* platform,
    struct nanograph_graph_linkedlist* graph,
    char* ggraph_gui,
    FILE* ggraph_txt_result)
{
#define COMPARE(x) (0==strncmp(pt_line, x, strlen(x)))
#define COMPARE2(x,y) (0==strncmp(y, x, strlen(x)))

    char* pt_line;
    uint32_t preset, node_instance, IO_instance, iformat, nformat, iHWio, nHWio, iNode, nNode, iArc, nArc;
    
    nformat = nHWio = nNode = nArc = 0;
    pt_line = ggraph_gui;
    
    jump2next_valid_line(&pt_line);         /* skip "GUI graph - AUTOMATICALLY GENERATED, DO NOT MODIFY !" */
    jump2next_valid_line(&pt_line);         /* skip "nodes:" */
    /*
    select between IO and node
    remove the instance index and find the node
    insert the manisfest format in a list
    loop on all the nodes
    */
L_next_node:
    if (COMPARE("arcs"))
    {   jump2next_valid_line(&pt_line);
        goto L_arcs;
    }

    sscanf(pt_line, "  - %s %s", io_or_node, ctmp2);
    jump2next_valid_line(&pt_line);

    /* nodes:
       - IO:   data_in_0_1
       - node: detector1
         PRESET: 2
         SCRIPT: script2.txt
       - IO:   gpio_out_1_1  */
    if (COMPARE2("IO", io_or_node))
    {
        ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
        IO_instance = atoi(&(ctmp2[strlen(ctmp2)-1]));  // extract the instance index (TODO:this can be 2 digits)
        ctmp2[strlen(ctmp2) - 2] = '_';                 // replace the IO name as xxxxx_i

        for (iArc = 0; iArc < MAX_GRAPH_NB_HW_IO; iArc++)
        {
            if (0 == strcmp(platform->IO_arc[iArc].IO_name, ctmp2))
            {
                list_of_IO_HW[nHWio++] = iArc;  // stream_io_graph iArc idx_graph
                FORMATS[nformat++] = platform->IO_arc[iArc].IO_FMT_manifest;
                break;
            }
        }
    }
    
    if (COMPARE2("node", io_or_node))
    {
        ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
        node_instance = atoi(&(ctmp2[strlen(ctmp2)-1]));// extract the instance index
        ctmp2[strlen(ctmp2) - 2] = '\0';                // remove the instance index "[n"

        for (iNode = 0; iNode < MAX_GRAPH_NB_HW_IO; iNode++)
        {
            if (0 == strcmp(platform->all_nodes[iNode].nodeName, ctmp2))
            {
                NODES[nNode] = platform->all_nodes[iNode];
                NODES[nNode].graph_instance = node_instance;
                break;
            }
        }

        if (COMPARE("PRESET"))
        {   sscanf(pt_line, "%s %d", PRESET, &preset);
            NODES[nNode].preset = preset;
            jump2next_valid_line(&pt_line);
        }
        if (COMPARE("SCRIPT"))
        {   sscanf(pt_line, "%s %s", ctmp1, &fileName);
            NODES[nNode].TAG = preset;
            jump2next_valid_line(&pt_line);
        }
        if (COMPARE("COEFFS"))
        {   sscanf(pt_line, "%s %s", ctmp1, &fileName);
            NODES[nNode].trace_ID = preset;
            jump2next_valid_line(&pt_line);
        }
        nNode++;
    }
    goto L_next_node;


L_arcs:
    /*  select between IO and node arcs
        search the format in the list
        loop on arcs

        - print the IO
        - print the formats between ARC/NODES
        - print the nodes
        - print the arc connections

       arcs:
       - OPort0 IO:   data_in_0_1
         IPort0 node: detector1
       - OPort0 node: detector1
         IPort0 IO:   gpio_out_1_1
    */
    if (0 >= sscanf(pt_line, "  - %s %s %s", ctmp1, io_or_node, ctmp2))
    {  goto L_endGui;
    }
    jump2next_valid_line(&pt_line);
    if (0 >= sscanf(pt_line, "  %s %s %s", ctmp3, io_or_node2, ctmp4))
    {  goto L_endGui;
    }
    jump2next_valid_line(&pt_line);

    if (COMPARE2("IO", io_or_node))
    {
    }
    if (COMPARE2("node", io_or_node))
    {
    }
    goto L_arcs;

L_endGui:

    fprintf(ggraph_txt_result, "; --- FORMAT -----------------------------------------------------------\n");
    for (iformat = 0; iformat < nformat; iformat++)
    {
        fprintf(ggraph_txt_result, "format_index            %3d ; \n", iformat);
        fprintf(ggraph_txt_result, "format_frame_length     %3d ; \n", FORMATS[iformat].frame_length_bytes);
    }

    fprintf(ggraph_txt_result, "; --- IO ---------------------------------------------------------------\n");
    for (iHWio = 0; iHWio < nHWio; iHWio++)
    {
        fprintf(ggraph_txt_result, "stream_io_graph      %3d %3d ; \n", iHWio, list_of_IO_HW[iHWio]);
    }

    for (iNode = 0; iNode < nNode; iNode++)
    {
        fprintf(ggraph_txt_result, "; ----------------------------------------------------------------------\n");
        fprintf(ggraph_txt_result, "%s  %d \n", NODES[iNode].nodeName, NODES[iNode].graph_instance);
        fprintf(ggraph_txt_result, "node_preset %d \n", 0 /* PRESET */);
        fprintf(ggraph_txt_result, "end \n");
    }

    for (iArc = 0; iArc < nArc; iArc++)
    {
        //if (ARC[iarc] == IO && input)
        {
            fprintf(ggraph_txt_result, "arc_input   0 0     arm_stream_filter  0 0 0\n");
        }

        //if (ARC[iarc] == IO && output)
        {
            fprintf(ggraph_txt_result, "arc_output   0 0     arm_stream_filter  0 0 0\n");
        }
    }
    fprintf(ggraph_txt_result, "end \n");
}

#ifdef __cplusplus
}
#endif