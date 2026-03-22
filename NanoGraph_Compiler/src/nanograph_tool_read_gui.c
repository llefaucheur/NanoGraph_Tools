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
uint32_t list_of_IO_HWIDX[MAX_GRAPH_NB_HW_IO];
uint32_t list_of_IO_HW[MAX_GRAPH_NB_HW_IO];
char list_of_IO_HW_name[MAX_GRAPH_NB_HW_IO][NBCHAR_LINE];
time_t rawtime;
struct tm* timeinfo;

#define ARCIN 'i'
#define ARCOUT 'o'
#define ARCNODE 'n'

typedef struct {
    char IO_type;
    char node1[NBCHAR_LINE];
    char node2[NBCHAR_LINE];
    uint8_t fmtprod, fmtcons;
    uint8_t arcnode1, arcnode2;
    uint32_t hwioidx;
} arc_gui_t;

#define MAX_ARC_GUI 100
arc_gui_t arcs[MAX_ARC_GUI];


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
    uint32_t preset, node_instance, node_instance2, IO_instance, iformat, nformat, iHWio, nHWio, iNode, nNode, iArc, nArc;
    uint32_t nodeProd, nodeCons, inputPort, outputPort, nb_input_arc;
    struct nanograph_node_manifest* platform_node;
    
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
                list_of_IO_HWIDX[nHWio] = nHWio; // platform->IO_arc[iArc].fw_io_idx;
                list_of_IO_HW[nHWio] = platform->IO_arc[iArc].fw_io_idx;  // stream_io_graph iArc idx_graph
                strcpy(list_of_IO_HW_name[nHWio], ctmp2);
                FORMATS[nformat++] = platform->IO_arc[iArc].IO_FMT_manifest;
                nHWio++;
                break;
            }
        }
    }
    
    if (COMPARE2("node", io_or_node))
    {
        ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
        node_instance = atoi(&(ctmp2[strlen(ctmp2)-1]));// extract the instance index
        ctmp2[strlen(ctmp2) - 2] = '\0';                // remove the instance index "[n"
        
        /* find the node from the platform */
        for (iNode = 0; iNode < MAX_GRAPH_NB_HW_IO; iNode++)
        {
            if (0 == strcmp(platform->all_nodes[iNode].nodeName, ctmp2))
            {
                NODES[nNode] = platform->all_nodes[iNode];
                NODES[nNode].graph_instance = node_instance;
                break;
            }
        }

        if (COMPARE("preset"))
        {   sscanf(pt_line, "%s %d", PRESET, &preset);
            NODES[nNode].preset = preset;
            jump2next_valid_line(&pt_line);
        }
        if (COMPARE("script"))
        {   sscanf(pt_line, "%s %s", ctmp1, &fileName);
            //NODES[nNode].TAG = preset;
            jump2next_valid_line(&pt_line);
        }
        if (COMPARE("params"))
        {   sscanf(pt_line, "%s %s", ctmp1, &fileName);
            //NODES[nNode].trace_ID = preset;               // compute coefficients of the filter @@@ TODO
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

    arcs[nArc].fmtprod = arcs[nArc].fmtcons = 0;        // @@@ TODO !!

    // -OPort0 IO :   io_data_in[1]         // output 0 of io_data instance 1
    //  IPort1 node : router[2]             // input 1  of router instance 2
    if (COMPARE2("IO", io_or_node))         // arc_input ?
    {
        arcs[nArc].IO_type = ARCIN;
        strcpy(arcs[nArc].node1, ctmp4);
        inputPort = atoi(&(ctmp3[strlen(ctmp3) - 1]));

        arcs[nArc].arcnode1 = inputPort;

        // ctmp2 = IO name used to recover the fwioidx
        ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
        IO_instance = atoi(&(ctmp2[strlen(ctmp2) - 1]));  // extract the instance index (TODO:this can be 2 digits)
        ctmp2[strlen(ctmp2) - 2] = '_';                 // replace the IO name as xxxxx_i

        for (iArc = 0; iArc < nHWio; iArc++)
        {   if (0 == strcmp(ctmp2, list_of_IO_HW_name[iArc]))
            {   arcs[nArc].hwioidx = list_of_IO_HWIDX[iArc];
                break;
            }
        }
    }

    // - OPort3 node : router[1]            // output 3 of router instance 1
    //   IPort0 IO : io_data_out[2]         // input 0  of io_data instance 2
    else if (COMPARE2("IO", io_or_node2))   // arc_output ?
    {
        arcs[nArc].IO_type = ARCOUT;
        strcpy(arcs[nArc].node1, ctmp2);
        outputPort = atoi(&(ctmp1[strlen(ctmp1) - 1]));


        /* find the nb of input arcs of the node from the platform */
        ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
        node_instance = atoi(&(ctmp2[strlen(ctmp2) - 1]));// extract the instance index
        ctmp2[strlen(ctmp2) - 2] = '\0';                // remove the instance index "[n"
        for (iNode = 0; iNode < MAX_GRAPH_NB_HW_IO; iNode++)
        {   if (0 == strcmp(platform->all_nodes[iNode].nodeName, ctmp2))
            {   NODES[nNode] = platform->all_nodes[iNode];
                NODES[nNode].graph_instance = node_instance;
                break;
            }
        }
        nb_input_arc = platform->all_nodes[iNode].nbInputArc;
        arcs[nArc].arcnode1 = outputPort + nb_input_arc;


        // ctmp4 = IO name used to recover the fwioidx
        ctmp4[strlen(ctmp4) - 1] = '\0';                // remove the ']
        IO_instance = atoi(&(ctmp4[strlen(ctmp4) - 1]));  // extract the instance index (TODO:this can be 2 digits)
        ctmp4[strlen(ctmp4) - 2] = '_';                 // replace the IO name as xxxxx_i

        for (iArc = 0; iArc < nHWio; iArc++)
        {   if (0 == strcmp(ctmp4, list_of_IO_HW_name[iArc]))
            {   arcs[nArc].hwioidx = list_of_IO_HWIDX[iArc];
                break;
            }
        }

    }

    // - OPort3 node : router[1]            // output 3 of router instance 1
    //   IPort1 node : sigp_detector[0]     // input 1  of detector instance 0
    else // arc_nodes
    {
        arcs[nArc].IO_type = ARCNODE;
        strcpy(arcs[nArc].node1, ctmp2);
        strcpy(arcs[nArc].node2, ctmp4);



        /* find the nb of input arcs of the node from the platform */
        ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
        node_instance = atoi(&(ctmp2[strlen(ctmp2) - 1]));// extract the instance index
        ctmp2[strlen(ctmp2) - 2] = '\0';                // remove the instance index "[n"
        for (iNode = 0; iNode < MAX_GRAPH_NB_HW_IO; iNode++)
        {   if (0 == strcmp(platform->all_nodes[iNode].nodeName, ctmp2))
            {   NODES[nNode] = platform->all_nodes[iNode];
                NODES[nNode].graph_instance = node_instance;
                break;
            }
        }
        nb_input_arc = platform->all_nodes[iNode].nbInputArc;   
        
        outputPort = atoi(&(ctmp1[strlen(ctmp1) - 1]));
        arcs[nArc].arcnode1 = outputPort + nb_input_arc;

        inputPort = atoi(&(ctmp3[strlen(ctmp3) - 1]));
        arcs[nArc].arcnode2 = inputPort;
    }
    nArc++;
    goto L_arcs;

L_endGui:
    time(&rawtime);
    timeinfo = localtime(&rawtime);
    fprintf(ggraph_txt_result, ";--------------------------------------------------------------------------\n");
    fprintf(ggraph_txt_result, ";  DATE %s", asctime(timeinfo));
    fprintf(ggraph_txt_result, ";  AUTOMATICALLY GENERATED CODES\n");
    fprintf(ggraph_txt_result, ";  DO NOT MODIFY !\n");
    fprintf(ggraph_txt_result, ";\n");
    fprintf(ggraph_txt_result, "; --- HEADER --------------------------------------------------------------\n");
    fprintf(ggraph_txt_result, "graph_locations -1 -1 -1 -1  0 0 0 \n");
    fprintf(ggraph_txt_result, ";\n");
    fprintf(ggraph_txt_result, "; --- FORMAT -----------------------------------------------------------\n");
//    for (iformat = 0; iformat < nformat; iformat++)
    {
        //fprintf(ggraph_txt_result, "format_index        %3d      \n", iformat);
        fprintf(ggraph_txt_result, "format_index        %3d      \n", 0);
        //        fprintf(ggraph_txt_result, "format_frame_length %3d      \n", FORMATS[iformat].frame_length_bytes);
        fprintf(ggraph_txt_result, "format_frame_length %3d      \n", 16);
    }
    fprintf(ggraph_txt_result, ";\n");

    fprintf(ggraph_txt_result, "; --- IO ------------------------------------------------------------------\n");
    for (iHWio = 0; iHWio < nHWio; iHWio++)
    {
        fprintf(ggraph_txt_result, "stream_io_graph     %3d %3d ; %s \n", iHWio, list_of_IO_HW[iHWio], list_of_IO_HW_name[iHWio]);
    }
    fprintf(ggraph_txt_result, ";\n");

    for (iNode = 0; iNode < nNode; iNode++)
    {
        if (iNode == 0)
            fprintf(ggraph_txt_result, "; --- NODES ---------------------------------------------------------------\n");
        else
            fprintf(ggraph_txt_result, "; -------------------------------------------------------------------------\n");
        fprintf(ggraph_txt_result, "node %-15s  %d \n", NODES[iNode].nodeName, NODES[iNode].graph_instance);
        fprintf(ggraph_txt_result, "    node_preset       %d \n", 0 /* PRESET */);
        fprintf(ggraph_txt_result, ";\n");
    }

    fprintf(ggraph_txt_result, "; --- ARCS ----------------------------------------------------------------\n");
    fprintf(ggraph_txt_result, "; \n");
    fprintf(ggraph_txt_result, "; Syntax \n");
    fprintf(ggraph_txt_result, ";     arc_input{ io / fmtProd }         { node / inst / arc / fmtCons }\n");
    fprintf(ggraph_txt_result, ";     arc_nodes{ inst / arc / fmtProd } { inst / arc / fmtCons }\n");
    fprintf(ggraph_txt_result, ";     arc_output{ io / fmtCons }        { node / inst / arc / fmtProd }\n");
    fprintf(ggraph_txt_result, "; \n");


    for (iArc = 0; iArc < nArc; iArc++)
    {
        if (arcs[iArc].IO_type == ARCIN)
        {
            strcpy(ctmp2, arcs[iArc].node1);
            ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
            node_instance = atoi(&(ctmp2[strlen(ctmp2) - 1]));// extract the instance index
            ctmp2[strlen(ctmp2) - 2] = '\0';                // remove the instance index "[n"

            fprintf(ggraph_txt_result, "arc_input  %d %d   %-15s %d %d %d\n",
                arcs[iArc].hwioidx, arcs[iArc].fmtprod,
                ctmp2, node_instance, arcs[iArc].arcnode1, arcs[iArc].fmtcons);
        }
    }
    fprintf(ggraph_txt_result, ";\n");
    for (iArc = 0; iArc < nArc; iArc++)
    {
        if (arcs[iArc].IO_type == ARCNODE)
        {
            strcpy(ctmp2, arcs[iArc].node1);
            ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
            node_instance = atoi(&(ctmp2[strlen(ctmp2) - 1]));// extract the instance index
            ctmp2[strlen(ctmp2) - 2] = '\0';                // remove the instance index "[n"
            strcpy(ctmp4, arcs[iArc].node2);
            ctmp4[strlen(ctmp4) - 1] = '\0';                // remove the ']
            node_instance2 = atoi(&(ctmp4[strlen(ctmp4) - 1]));// extract the instance index
            ctmp4[strlen(ctmp4) - 2] = '\0';                // remove the instance index "[n"

            fprintf(ggraph_txt_result, "arc_nodes  %-15s %d %d %d  %-15s %d %d %d\n",
                ctmp2, node_instance, arcs[iArc].arcnode1, arcs[iArc].fmtprod,
                ctmp4, node_instance2, arcs[iArc].arcnode2, arcs[iArc].fmtcons);
        }
    }
    fprintf(ggraph_txt_result, ";\n");
    for (iArc = 0; iArc < nArc; iArc++)
    {
        if (arcs[iArc].IO_type == ARCOUT)
        {
            strcpy(ctmp2, arcs[iArc].node1);
            ctmp2[strlen(ctmp2) - 1] = '\0';                // remove the ']
            node_instance = atoi(&(ctmp2[strlen(ctmp2) - 1]));// extract the instance index
            ctmp2[strlen(ctmp2) - 2] = '\0';                // remove the instance index "[n"
            fprintf(ggraph_txt_result, "arc_output %d %d   %-15s %d %d %d\n",
                arcs[iArc].hwioidx, arcs[iArc].fmtprod,
                ctmp2, node_instance, arcs[iArc].arcnode1, arcs[iArc].fmtcons);
        }
    }
    fprintf(ggraph_txt_result, ";\n");
    fprintf(ggraph_txt_result, "end ; \n");
}

#ifdef __cplusplus
}
#endif