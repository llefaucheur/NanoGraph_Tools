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





/**=================================================================================================
  @brief            (main) 
  @param[in/out]    none
  @return           int
  @par              read the graph 
  @remark
 */

void arm_nanograph_read_GUI (struct nanograph_platform_manifest *platform,
                            struct nanograph_graph_linkedlist *graph, 
                            char *ggraph_txt)
{

#define COMPARE(x) (0==strncmp(pt_line, x, strlen(x)))

    char* pt_line, ctmp[NBCHAR_LINE], paths[MAX_NB_PATH][NBCHAR_LINE];
    int32_t idx_format, idx_node, idx_nanograph_io, idx_path, i, j, iarc, platform_node_idx, idx_node_script;
    int32_t current_arc_is_IO;
    int64_t iL;
    
    pt_line = ggraph_txt;
    idx_path = idx_format = idx_node = idx_nanograph_io = 0;

    /* DEFAULT VALUES jitterFactor */
    graph->procid_allowed_gr4 = 1;          // default values : main proc = #0
    for (i = 0; i< MAX_NB_NODES; i++) 
    {   graph->arc[i].sizeFactor = 1.0;
    graph->arc[i].alignmentBytes = 4;
    }

    /* DEFAULT ARCID is UNUSED  */
    for (i = 0; i < MAX_NB_NODES; i++)
    {
        for (j = 0; j < MAX_NB_NANOGRAPH_PER_NODE; j++)
        {
            graph->all_nodes[i].arc[j].arcID = ARC_ID_UNUSED;
        }
    }

    /* DEFAULT GRAPH MAPPING */
    #define m(i) graph->option_graph_locations[i]
    m(GRAPH_PIO_HW) = m(GRAPH_PIO_GRAPH) = m(GRAPH_SCRIPTS) = m(GRAPH_LINKED_LIST) = -1;
    m(GRAPH_FORMATS) = m(GRAPH_ARCS) = 0;
    #undef m

    jump2next_valid_line(&pt_line);

    while (globalEndFile != FOUND_END_OF_FILE && *pt_line != '\0')
    {
        if (COMPARE("nodes"))
        {
            read_state = NODE_STATE;
            jump2next_valid_line(&pt_line);
GUI graph 
  nodes:
  - IO:   IMU1
    FRAMEL: 2
  - node: filter1
    PRESET: 1
  - node: filter2
    PRESET: 2
  - node: detector1
  - IO:   LED1
  arcs:
  - OPort0 IO:   IMU1
    IPort0 node: filter1
  - OPort0 node: filter1
    IPort0 node: filter2
  - OPort0 node: filter2
    IPort0 node: detector1
  - OPort0 node: detector1
    IPort0 IO:   LED1


        }
        if (COMPARE("arcs"))
        {
            read_state = ARC_STATE;
            jump2next_valid_line(&pt_line);
        }
        /* ----------------------------------------------- STREAM IO --------------------------------------------------------*/
        if (COMPARE(stream_io_graph))           // nanograph_io_graph "soft ID" 
        {   uint32_t fw_io_idx, graph_io_idx;
            fields_extract(&pt_line, "cii", ctmp, &graph_io_idx, &fw_io_idx);

            graph->arc[graph->nb_arcs].idx_arc_in_graph = graph_io_idx;
            if (graph_io_idx >= MAX_GRAPH_IO_IDX)
            {   fprintf(stderr, "\n\n too much IOs"); exit(6);
            }
            graph->arc[graph->nb_arcs].ioarc_flag = 1;
            graph->current_io_arc = graph->nb_arcs;
            graph->nb_arcs++; graph->nb_io_arcs++;

            graph->arc[graph->current_io_arc].fw_io_idx = fw_io_idx;
            LoadPlatformArc(&(graph->arc[graph->current_io_arc]), &(platform->IO_arc[fw_io_idx]));
            graph->arc[graph->current_io_arc].initialized_from_platform = 1; /* initialization is done */
            platform->IO_arc[fw_io_idx].arc_graph_ID = graph->current_io_arc;

            if (platform->max_io_al_idx <= fw_io_idx)  /* largest io_al_idx to dimension platform_io_al_idx_to_stream[] */
            {   platform->max_io_al_idx = fw_io_idx +1;
            }
        }
        if (COMPARE(stream_io_hwid))            // stream_io_hwid HWID 
        {   
        }
        if (COMPARE(stream_io_format))          // stream_io_format FORMAT 
        {   fields_extract(&pt_line, "ci", ctmp, &(graph->arc[graph->current_io_arc].format_idx));
        }            
        if (COMPARE(stream_io_setting))
        {
            uint32_t callbk, w1, w2, w3;
            fields_extract(&pt_line, "ciiii", ctmp, &callbk , &w1, &w2, &w3);
            graph->arc[graph->current_io_arc].setting_callback = callbk;
            graph->arc[graph->current_io_arc].settings[0] = w1;
            graph->arc[graph->current_io_arc].settings[1] = w2;
            graph->arc[graph->current_io_arc].settings[2] = w3;
        }
        /* ----------------------------------------------- FORMATS ----------------------------------------------------------*/
        if (COMPARE(format_index))
        {   fields_extract(&pt_line, "ci", ctmp, &(graph->current_format_index)); 
            graph->arcFormat[graph->current_format_index].raw_data = NANOGRAPH_S16;    /* default format data */
            graph->arcFormat[graph->current_format_index].frame_length_bytes = 1;
            graph->arcFormat[graph->current_format_index].nchan = 1;
            graph->nb_formats = MAX(graph->current_format_index, graph->nb_formats);
        }
        if (COMPARE(format_frame_length))
        {   fields_extract(&pt_line, "ci", ctmp, &(graph->arcFormat[graph->current_format_index].frame_length_bytes)); 
        }
        if (COMPARE(format_interleaving))
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            graph->arcFormat[graph->current_format_index].deinterleaved = i; 
        }   
        if (COMPARE(format_raw_data))
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            graph->arcFormat[graph->current_format_index].raw_data = i;
        }   
        if (COMPARE(format_nbchan))
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            graph->arcFormat[graph->current_format_index].nchan = i;
        }   
        if (COMPARE(format_sampling_rate))      /* format_sampling_rate  "unit frequency" */
        {   float fdata;
            char unit[NBCHAR_LINE];
            fields_extract(&pt_line, "ccf", ctmp, unit, &fdata); 
            convert_to_mks_unit(unit, &fdata);   /* conversion to standard unit used in "format" (Hz) */
            graph->arcFormat[graph->current_format_index].samplingRate = fdata;
        }   
        if (COMPARE(format_sampling_period))    /* format_sampling_period "unit timePeriod" */
        {   float fdata;
            char unit[NBCHAR_LINE];
            fields_extract(&pt_line, "ccf", ctmp, unit, &fdata); 
            convert_to_mks_unit(unit, &fdata);   /* conversion to standard unit used in "format" (Hz) */
            graph->arcFormat[graph->current_format_index].samplingRate = fdata;
        }   
        if (COMPARE(format_time_stamp))
        {   
        }   
        if (COMPARE(format_sdomain))
        {   
        }   
        if (COMPARE(format_domain))
        {   
        }   
        if (COMPARE(format_audio_mapping))
        {   
        }   
        if (COMPARE(format_motion_mapping))
        {   
        }   
        if (COMPARE(format_2d_height))
        {   
        }   
        if (COMPARE(format_2d_width))
        {   
        }   
        if (COMPARE(format_2d_border))
        {   
        }   

        /* ----------------------------------------------- NODES ----------------------------------------------------------*/
        if (COMPARE(node_new))  //node <node_name> <instance_index>
        {   uint32_t instance;
            char ctmp[NBCHAR_LINE], cstring1[NBCHAR_LINE];
            struct nanograph_node_manifest *platform_node;
            struct nanograph_node_manifest *graph_node;

            fields_extract(&pt_line, "cci", ctmp, cstring1, &instance);
            search_platform_node(cstring1, &platform_node, &platform_node_idx, platform, graph);

            graph_node = &(graph->all_nodes[graph->nb_nodes]);
            graph_node->platform_node_idx = platform_node_idx;

            if (platform_node_idx == NanoGraph_script_index)                 /* is it arm_nanograph_script ? */
            {   
                graph_node->node_script.nb_reg = 6;       /* default number of registers + R12 + stack size */
                graph_node->node_script.nb_stack = 6;
                graph_node->node_script.ram_heap_size = 0;
                graph_node->node_script.arc_script = graph->nb_arcs;
                graph_node->arc[0].arcID = graph->nb_arcs;   /* dummy arc used for regsiters */
                graph->nb_arcs++;
            }
            
            if (NanoGraph_script_index == platform_node_idx)
            {   idx_node_script = graph->nb_nodes;
            } else
            {   idx_node_script = (-1); 
            }
                 
            LoadPlatformNodeDefaults(graph_node, platform_node);
            graph_node->initialized_from_platform = 1;
            graph_node->graph_instance = instance;
            graph_node->locking_arc = 1;
            graph->nb_nodes++;                                                  /* all mem_VID = 0 */

        }
        if (COMPARE(node_preset))
        {   fields_extract(&pt_line, "ci", ctmp, &(graph->all_nodes[graph->nb_nodes -1].preset)); 
        }
        if (COMPARE(node_malloc_add))     // addition of Bytes in a memory bank 
        {   uint32_t nBytes, iMem; 
            fields_extract(&pt_line, "cii", ctmp, &nBytes, &iMem);
             graph->all_nodes[graph->nb_nodes -1].memreq[iMem].malloc_add = nBytes;
        }
        if (COMPARE(node_map_block))
        {   fields_extract(&pt_line, "cii", ctmp, &i, &j); graph->all_nodes[graph->nb_nodes -1].memreq[i].mem_VID = j; 
        }
        if (COMPARE(node_map_swap))
        {   fields_extract(&pt_line, "cii", ctmp, &i, &j); graph->all_nodes[graph->nb_nodes -1].memreq[i].toSwap = 1;
            graph->all_nodes[graph->nb_nodes -1].memreq[i].swapVID = j;
            graph->all_nodes[graph->nb_nodes -1].memreq[i].swap_arc = graph->nb_arcs;
            graph->nb_arcs++;               /* an arc is declared for memory swapping */
        }
        if (COMPARE(node_memory_clear))
        {   fields_extract(&pt_line, "ci", ctmp, &i);  graph->all_nodes[graph->nb_nodes -1].memreq[i].toClear = 1;
        }   
        if (COMPARE(node_trace_id))
        {   
        }   

        if (COMPARE(node_map_proc))             /* node_map_proc K */
        {   fields_extract(&pt_line, "cI", ctmp, &i);
            graph->all_nodes[graph->nb_nodes - 1].node_assigned_proc = i;
        }   

        if (COMPARE(node_map_arch))             /* node_map_arch K */
        {   fields_extract(&pt_line, "cI", ctmp, &i);
            graph->all_nodes[graph->nb_nodes - 1].node_assigned_arch = i;
        }   

        if (COMPARE(node_map_thread))           /* node_map_thread K */
        {   fields_extract(&pt_line, "cI", ctmp, &i);
            graph->all_nodes[graph->nb_nodes - 1].node_assigned_priority = i;
        }   

        if (COMPARE(node_user_key))     //   node_user_key 0x2334809458	; 64 bits key
        {   uint64_t K0; 
            fields_extract(&pt_line, "cI", ctmp, &K0);
            graph->all_nodes[graph->nb_nodes -1].use_user_key = 1;
            graph->all_nodes[graph->nb_nodes -1].user_key[0] = K0;
        }   
        if (COMPARE(node_map_verbose))
        {   
        }   
        if (COMPARE(node_memory_isolation))     // activate the memory protection unit
        {   fields_extract(&pt_line, "cI", ctmp, &i);
            graph->all_nodes[graph->nb_nodes - 1].memory_protection_flag = i;
        }   
        if (COMPARE(node_parameters))
        {   uint32_t TAG; 
            fields_extract(&pt_line, "ci", ctmp, &TAG);
            graph->all_nodes[graph->nb_nodes -1].TAG = TAG; /* selection of parameters to load "0" means all */ 
            nanograph_tool_read_parameters(&pt_line, platform, graph, 
                &(graph->all_nodes[graph->nb_nodes -1].ParameterSizeW32), &(graph->all_nodes[graph->nb_nodes -1].PackedParameters[0])); 
        }
        if (COMPARE(node_script_code))
        {   nanograph_tool_read_code(&pt_line, platform, graph, &(graph->all_nodes[graph->nb_nodes -1].node_script));  // macro assembler
        }
        /* ----------------------------------------------- SCRIPTS ----------------------------------------------------------*/
        if (COMPARE(common_script))
        {   fields_extract(&pt_line, "ci", ctmp, &(graph->all_scripts[graph->idx_script].script_ID)); /* instance number (its identification) */
            graph->idx_script = graph->nb_scripts;
            graph->all_scripts[graph->idx_script].nb_reg = 16;       /* default number of registers  + R12 + stack size */
            graph->all_scripts[graph->idx_script].nb_stack = 6;
            graph->all_scripts[graph->idx_script].ram_heap_size = 0;
            graph->all_scripts[graph->idx_script].arc_script = graph->nb_arcs;
            graph->nb_arcs++;
            graph->nb_scripts++;
        }
        if (COMPARE(script_name))               // script_name TEST1    ; for references in the GUI
        {   fields_extract(&pt_line, "cc", ctmp, ctmp); 
        }
        if (COMPARE(script_stack))              // script_stack        6    size of the stack in word64 (default = 6)
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            if (idx_node_script >= 0)
            {   graph->all_nodes[idx_node_script].node_script.nb_stack = i; 
            } else
            {   graph->all_scripts[graph->idx_script].nb_stack = i;
            }
        }
        if (COMPARE(script_parameter))          // script_parameter 50    size of the heap
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            if (idx_node_script >= 0)
            {   graph->all_nodes[idx_node_script].node_script.ram_heap_size = i; 
            } else
            {   graph->all_scripts[graph->idx_script].ram_heap_size = i;
            }
        }
        if (COMPARE(script_mem_shared))         // script_mem_shared 1      Is it a private RAM(0) or can it be shared with other scripts(1)
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            if (idx_node_script >= 0)
            {   graph->all_nodes[idx_node_script].node_script.stack_memory_shared = i; 
            } else
            {   graph->all_scripts[graph->idx_script].stack_memory_shared = i;
            }
        }
        if (COMPARE(script_mem_map))            // script_mem_map    0      Memory mapping to VID #0 (default) 
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            if (idx_node_script >= 0)
            {   graph->all_nodes[idx_node_script].node_script.mem_VID = i; 
            } else
            {   graph->all_scripts[graph->idx_script].mem_VID = i;
            }
        }
        if (COMPARE(script_code))               // script_code
        {   nanograph_tool_read_code(&pt_line, platform, graph, &(graph->all_scripts[graph->idx_script]));  // macro assembler
        }
        if (COMPARE(script_assembler))          // script_assembler 0      ; code of the binary format (0 : default, or native architecture)
        {   fields_extract(&pt_line, "ci", ctmp, &(graph->all_scripts[graph->idx_script].script_format));  

            nanograph_tool_read_assembler(&pt_line, platform, graph, &(graph->all_scripts[graph->idx_script]));
        }
        
        /* --------------------------------------------- ARCS ----------------------------------------------------------------------*/
        if (COMPARE(arc_input))              //arc_input    idx_nanograph_io fmtProd     node_name instance arc_index Format (+HQOS)
        {   uint32_t instCons, inPort, fmtCons, fmtProd, arcIO, SwcConsGraphIdx;
            struct nanograph_node_manifest *graph_node_Cons;
            char Consumer[NBCHAR_LINE], HQOS[NBCHAR_LINE];

            fields_extract(&pt_line, "ciiciiic", ctmp, &idx_nanograph_io, &fmtProd, Consumer, &instCons, &inPort, &fmtCons, HQOS); 
            findArcIOWithThisID(graph, idx_nanograph_io, &arcIO);          /* arcIO receives the stream from idx_nanograph_IO */
            current_arc_is_IO = 1;
            //graph->arc[arcIO] = graph->arc[arcIO];                    /* copy the already filled arc IO details to this new arc */

            search_graph_node(Consumer, &graph_node_Cons, &SwcConsGraphIdx, graph); /* update the arc of the consumer */
            graph->arc[arcIO].fmtProd = fmtProd;        
            graph->arc[arcIO].fmtCons = fmtCons;        
            graph->arc[arcIO].SwcProdGraphIdx = SwcConsGraphIdx;
            graph->arc[arcIO].HQoS = HQOS[0] == 'h' || HQOS[0] == 'H';                  // HQoS
            graph_node_Cons->arc[inPort].fmtProd = fmtProd;   // @@@ check frame_length_option.. is compatible with this format            
            graph_node_Cons->arc[inPort].fmtCons = fmtCons;               
            graph_node_Cons->arc[inPort].arcID = arcIO;               
            graph_node_Cons->arc[inPort].rx0tx1 = 0;
            graph_node_Cons->connected_to_the_graph = 1;
        }
        if (COMPARE(arc_output))             //arc_output   idx_nanograph_io fmtCons     node_name    instance arc_index Format  (+HQOS)
        {   uint32_t instProd, outPort, fmtCons, fmtProd, arcIO, SwcProdGraphIdx;
            struct nanograph_node_manifest *graph_node_Prod;
            char Producer[NBCHAR_LINE], HQOS[NBCHAR_LINE];

            fields_extract(&pt_line, "ciiciiic", ctmp, &idx_nanograph_io, &fmtCons, Producer, &instProd, &outPort, &fmtProd, HQOS);
            findArcIOWithThisID(graph, idx_nanograph_io, &arcIO);      /* arcIO send the stream to idx_nanograph_IO */
            current_arc_is_IO = 1;
            //graph->arc[arcIO] = graph->arc[arcIO];                  /* copy the already filled arc IO details to this new arc */

            search_graph_node(Producer, &graph_node_Prod, &SwcProdGraphIdx, graph);
            graph->arc[arcIO].fmtProd = fmtProd;           
            graph->arc[arcIO].fmtCons = fmtCons;           
            graph->arc[arcIO].SwcProdGraphIdx = SwcProdGraphIdx;
            graph->arc[arcIO].HQoS = HQOS[0] == 'h' || HQOS[0] == 'H';                  // HQoS
            graph_node_Prod->arc[outPort].fmtProd = fmtProd;               
            graph_node_Prod->arc[outPort].fmtCons = fmtCons;  // @@@ check frame_length_option.. is compatible with this format                
            graph_node_Prod->arc[outPort].arcID = arcIO;               
            graph_node_Prod->arc[outPort].rx0tx1 = 1;
            graph_node_Prod->arc[outPort].HQoS = HQOS[0] == 'h' || HQOS[0] == 'H';      // HQoS
            graph_node_Prod->connected_to_the_graph = 1;
        }
        if (COMPARE(arc_nodes))  //arc_nodes node1 instance arc_index arc_format_src     node2 instance arc_index arc_format_dst
        {   uint32_t instProd, instCons, outPort, inPort, fmtProd, fmtCons, SwcProdGraphIdx, SwcConsGraphIdx;
            struct nanograph_node_manifest *graph_node_Prod, *graph_node_Cons;
            char Producer[NBCHAR_LINE], Consumer[NBCHAR_LINE], HQOS[NBCHAR_LINE];

            fields_extract(&pt_line, "cciiiciiic", ctmp, Producer, &instProd, &outPort, &fmtProd, Consumer, &instCons, &inPort, &fmtCons, HQOS);
            search_graph_node(Producer, &graph_node_Prod, &SwcProdGraphIdx, graph);
            current_arc_is_IO = 0;

            graph_node_Prod->arc[outPort].fmtProd = fmtProd;
            graph_node_Prod->arc[outPort].SwcProdGraphIdx = SwcProdGraphIdx;
            graph_node_Prod->arc[outPort].arcID = graph->nb_arcs;  
            graph_node_Prod->arc[outPort].rx0tx1 = 1;
            graph_node_Prod->arc[outPort].HQoS = HQOS[0] == 'h' || HQOS[0] == 'H';      // HQoS
            graph_node_Prod->connected_to_the_graph = 1;


            search_graph_node(Consumer, &graph_node_Cons, &SwcConsGraphIdx, graph);
            graph_node_Cons->arc[inPort].fmtCons = fmtCons;
            graph_node_Cons->arc[inPort].SwcConsGraphIdx = SwcConsGraphIdx;
            graph_node_Cons->arc[inPort].arcID = graph->nb_arcs;    
            graph_node_Cons->arc[inPort].rx0tx1 = 0;
            graph_node_Cons->arc[inPort].HQoS = HQOS[0] == 'h' || HQOS[0] == 'H';       // HQoS
            graph_node_Cons->connected_to_the_graph = 1;

            graph->arc[graph->nb_arcs].SwcProdGraphIdx = SwcProdGraphIdx;
            graph->arc[graph->nb_arcs].SwcConsGraphIdx = SwcConsGraphIdx;
            graph->arc[graph->nb_arcs].fmtProd = fmtProd;
            graph->arc[graph->nb_arcs].fmtCons = fmtCons;
            graph->arc[graph->nb_arcs].HQoS = HQOS[0] == 'h' || HQOS[0] == 'H';         // HQoS

            graph->nb_arcs ++;
        } 
        if (COMPARE(arc_map_memID))    //arc_map_memID     0    
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            iarc = current_arc_is_IO ? idx_nanograph_io : graph->nb_arcs - 1;
            graph->arc[iarc].memVID = i;
        }
        if (COMPARE(arc_flush))       // arc_flush 1    multiprocessing cache update
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
            iarc = current_arc_is_IO ? idx_nanograph_io : graph->nb_arcs - 1;
            graph->arc[iarc].flush = i;
        }
        if (COMPARE(arc_extend_address))    // TODO
        {   fields_extract(&pt_line, "ci", ctmp, &i); 
        }
        if (COMPARE(arc_jitter_ctrl))   // factor to apply to the minimum size between the producer and the consumer, default = 1.0 (no jitter)
        {
            float jitterFactor;
            fields_extract(&pt_line, "cf", ctmp, &jitterFactor);
            iarc = current_arc_is_IO ? idx_nanograph_io : graph->nb_arcs - 1;
            graph->arc[iarc].sizeFactor = jitterFactor;
        }
        if (COMPARE(arc_memory_alignment))  // align the arc buffer to the cache line
        {
            fields_extract(&pt_line, "ci", ctmp, &i);
            graph->arc[i].alignmentBytes = i;
        } 
        if (COMPARE(arc_control_script))            // align the arc buffer to the cache line
        {
            fields_extract(&pt_line, "ci", ctmp, &i);
            graph->arc[i].alignmentBytes = i;
        } 
    }
}

#ifdef __cplusplus
}
#endif