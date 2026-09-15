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
#include <math.h>

#include "../nanograph_common_included_in_tools.h"
#include "../nanograph_interpreter_included_in_tools.h"

#include "nanograph_tool_define.h"
#include "nanograph_tool_types.h"
#include "nanograph_tool_include.h"

#include <ctype.h>  // isdigit

#ifndef script_parameters
#define script_parameters "script_parameters"
#endif

#ifndef SECTION_END
#define SECTION_END "end"
#endif

    typedef union {
        uint32_t u32;
        int32_t i32;
        float f32;
    } anydata32;

    struct literal_const
    {
        char string[NBCHAR_LINE];       // utf8/16
        uint32_t const_dtype;
        anydata32 data;
        double ddata;
    };
    typedef struct literal_const literal_const_t;


#define cASM 32             // characters per symbol/instructions
#define cNFIELDS 18         // OPLJ_RESTORE 15 registers + header + instruction  = 17

    /* instruction types */
#define COND        0       // conditional execution & Labels
#define INST_TEST   1
#define INST_ALU    2
#define INST_CTRL   3

#define S_IF_YES       "ifyes "  
#define S_IF_NOT       "ifno " 
#define S_AND_IF       "and "  
#define S_OR_IF        "or "   
#define S_IF_YES_CLEAR "ifyes1 "
#define S_IF_NOT_CLEAR "ifno1 "


/* Instruction split in "s[cNFIELDS]", conditional field pre-loaded in format_line() */
#define TESTIF      0       // type of test (if any)
#define ALUDST      1
#define ALUSRC1     2
#define ALUOP       3       // operation
#define ALUSRC2     4       
#define ALUSRC3     5       // for wrbf/rdbf

#define CTRLOP      1
#define CTRLSRC1    2
#define CTRLSRC2    3
#define CTRLSRC3    4
#define CTRLSRC4    5
#define CTRLSRC5    6
#define CTRLSRC6    7
#define CTRLSRC7    8
#define CTRLSRC8    9


/* --------------------------- instruction coding ----------------------------*/
#define CONDF 0
#define INSTF 1
#define DSTF  2
#define OPCODEF 3
#define SRC1F 4
#define SRC2F 5
#define KF    6

// COND
#define M_IF "if"           // if yes / no
// INST
#define M_TEST "te"         // test
#define M_LD "ld"
#define M_JUMP "ju"
#define M_CALL "ca"
#define M_LABEL "la"
#define M_RETURN "re"
// REGS
#define M_REG "r"
#define M_STACK "sp"

    literal_const_t CONST[10];
    char s[cNFIELDS][cASM], * pdbg;
    uint32_t INST;              // current instruction
    int32_t NB_CONST;           // number of literal constant 

    static int is_script_data_section(const char* line)
    {
        return (0 == strncmp(line, script_parameters, strlen(script_parameters))) ||
            (0 == strncmp(line, script_parameter, strlen(script_parameter))) ||
            (0 == strncmp(line, script_heap, strlen(script_heap)));
    }

    static int is_script_section_end(const char* line)
    {
        return (0 == strncmp(line, SECTION_END, strlen(SECTION_END)));
    }

    static uint32_t literal_dtype_to_abc(uint32_t dtype)
    {
        switch (dtype)
        {
        case DTYPE_INT32:  return abcRK_next_int32;
        case DTYPE_UINT32: return abcRK_next_uint32;
        case DTYPE_FP32:   return abcRK_next_fp32;
        case DTYPE_CHAR8:  return abcRK_next_UTF8;
        case DTYPE_CHAR16: return abcRK_next_UTF16;
        default:           return abcRK_next_uint32;
        }
    }

    static void lowercase_symbol(char* symbol)
    {
        uint32_t i;
        for (i = 0; symbol[i] != '\0'; i++)
        {
            symbol[i] = (char)tolower((unsigned char)symbol[i]);
        }
    }

    static void encode_next_u32_operand(uint32_t msb, uint32_t lsb, uint32_t value)
    {
        INSERT_BITS(INST, lsb + 3, lsb, RegNoneK);
        INSERT_BITS(INST, msb, lsb + 4, abcRK_next_uint32);
        CONST[NB_CONST].const_dtype = DTYPE_UINT32;
        CONST[NB_CONST].data.u32 = value;
        NB_CONST++;
    }

    static void remember_label_use(struct nanograph_script* script, const char* symbol,
        uint32_t const_index, uint32_t label_type)
    {
        char* dst = script->Label_positions[script->idx_label].symbol;
        strncpy(dst, symbol, NBCHAR_NANOGRAPH_NAME - 1);
        dst[NBCHAR_NANOGRAPH_NAME - 1] = '\0';
        if (dst[0] == '#')
        {
            memmove(dst, dst + 1, strlen(dst));
        }
        lowercase_symbol(dst);
        script->Label_positions[script->idx_label].offset = const_index;
        script->Label_positions[script->idx_label].label_type = label_type;
        script->idx_label++;
    }


    void decode_cond(char* scond, uint32_t cond)
    {
        switch (cond)
        {
        case NO_COND_EXE:   strcpy(scond, ""); break;        // plain OP_INST 
        case IF_YES:        strcpy(scond, "ifyes "); break;  // generic conditional execution
        case IF_NOT:        strcpy(scond, "ifnot "); break;  // generic conditional execution
        case AND_IF:        strcpy(scond, "and   "); break;  // only with OP_TESTxx 
        case OR_IF:         strcpy(scond, "orif  "); break;  // only with OP_TESTxx 
        case IF_YES_CLEAR:  strcpy(scond, "ifyes1"); break;  // conditional execution and clear flag
        case IF_NOT_CLEAR:  strcpy(scond, "ifnot1"); break;  // conditional execution and clear flag
        }
    }

    void decode_opcode(char* sopcode, uint32_t opcode)
    {
        switch (opcode)
        {
        case OP_TESTEQ: strcpy(sopcode, "test"); break; // == 
        case OP_TESTLE: strcpy(sopcode, "test"); break; // <=         
        case OP_TESTLT: strcpy(sopcode, "test"); break; // <          
        case OP_TESTNE: strcpy(sopcode, "test"); break; // !=                     
        case OP_TESTGE: strcpy(sopcode, "test"); break; // >=                     
        case OP_TESTGT: strcpy(sopcode, "test"); break; // >                      
        case OP_ALU: strcpy(sopcode, "alu"); break; // load / store + alu 
        case OP_CTRL: strcpy(sopcode, "ctrl"); break; // sets and jumps  
        }
    }

    /*  decode_opar(sopar, opar + (opcode<<8));  */
    void decode_opar(char* sopar, uint32_t opar, uint32_t opcode)
    {
        if (opcode < OP_ALU)
        {
            switch (opcode & 0xFF)
            {
            case OP_TESTEQ: strcpy(sopar, "=="); break;
            case OP_TESTLE: strcpy(sopar, "<="); break;
            case OP_TESTLT: strcpy(sopar, "< "); break;
            case OP_TESTNE: strcpy(sopar, "!="); break;
            case OP_TESTGE: strcpy(sopar, ">="); break;
            case OP_TESTGT: strcpy(sopar, "> "); break;
            }
            return;
        }


        if (opcode == OP_ALU)
        {
            switch (opar & 0xFF)
            {
            case OPAR_NOP: strcpy(sopar, "_");      break;  // ---    SRC2/K                          Ri = #K                            
            case OPAR_ADD: strcpy(sopar, "+");      break;  // +      SRC1 + SRC2                     PUSH: S=R+0  POP:R=S+R0   DUP: S=S+R0  DEL: R0=S+R0  DEL2: R0=S'+R0
            case OPAR_SUB: strcpy(sopar, "-");      break;  // -      SRC1 - SRC2                         MOVI #K: R=R0+K
            case OPAR_MUL: strcpy(sopar, "x");      break;  // *      SRC1 * SRC2        
            case OPAR_DIV: strcpy(sopar, "/ ");     break;  // /      SRC1 / SRC2                     DIV  
            case OPAR_LRSHFT: strcpy(sopar, ">>");     break;  // >>     SRC1 >> SRC2                    logical right shift (sign not propagated)
            case OPAR_OR: strcpy(sopar, "|");      break;  // |      SRC1 | SRC2                     if SRC is a pointer then it is decoded as *(SRC)
            case OPAR_NOR: strcpy(sopar, "nor");    break;  // nor    !(SRC1 | SRC2)                  example TEST (*R1) > (*R2) + 3.14   or   R1 = (*R2) + R4
            case OPAR_AND: strcpy(sopar, "&");      break;  // &      SRC1 & SRC2  
            case OPAR_XOR: strcpy(sopar, "^");      break;  // ^      SRC1 ^ SRC2  
            case OPAR_MAX: strcpy(sopar, "max");    break;  // max    MAX (SRC1, SRC2)                rp = rp max rp     
            case OPAR_MIN: strcpy(sopar, "min");    break;  // min    MIN (SRC1, SRC2)                      
            case OPAR_MOD: strcpy(sopar, "mod");    break;  // %      SRC1 mod SRC2                    modulo             
            case OPAR_ADDMOD: strcpy(sopar, "addmod"); break;  // +%     SRC1 + SRC2        MODULO_DST    DST = OPAR SRC1 SRC2/K      
            case OPAR_SUBMOD: strcpy(sopar, "submod"); break;  // -%     SRC1 - SRC2        MODULO_DST    works for PTR    
            case OPAR_WRBF: strcpy(sopar, "wrbf");   break;  // DST | LEN POS | = SRC1     write a bit-field, followed by Len(LSB) Pos(LSB+1)
            case OPAR_RDBF: strcpy(sopar, "rdbf");   break;  // DST = SRC1 | LEN POS |     read a bit-field
            case OPAR_SWAP: strcpy(sopar, "swap");   break;  // swap (R15/SRC2 abc=0) bitreverse(1) swap8(2) ABCD->DCBA swap16(3) ABCD->BADC
            case OPAR_ABS: strcpy(sopar, "abs ");   break;  // r2 = abs r3
            }
        }

        if (opcode == OP_CTRL)
        {
            switch (opar & 0xFF)
            {
            case OPLJ_SET: strcpy(sopar, "set");     break; // set r2 / DTYPE_XXX / absolute 0 param 1 heap 2 graph 3 (PTR_MEMBANK_xx)
            case OPLJ_JUMP: strcpy(sopar, "jump");    break; // jump signed {K7} and push registers
            case OPLJ_BANZ: strcpy(sopar, "banz");    break; // branch if non-zero to signed {K7} and decrement register (bitfield)
            case OPLJ_CALL: strcpy(sopar, "call");    break; // call {K7} and push registers
            case OPLJ_SYSCALL: strcpy(sopar, "syscall"); break; // syscall {K7} and push registers
            case OPLJ_SAVE: strcpy(sopar, "save");    break; // save up to 14 registers
            case OPLJ_RESTORE: strcpy(sopar, "restore"); break; // restore up to 14 registers   
            case OPLJ_RETURN: strcpy(sopar, "return");  break; // return 
            case OPLJ_PARAM: strcpy(sopar, "param");   break; // move control register to DST (test flag, node entry/exit selection)
                //case OPLJ_LDBW   : strcpy(sopar, "ldbw   ");  // forced DTYPE memory access dst = *src1 int8
                //case OPLJ_STBW   : strcpy(sopar, "stbw   ");  // forced DTYPE memory access *dst = src uint16
            }
        }
    }

    void decode_abc(char* sabc, uint32_t reg7b)
    {
        if ((reg7b & SRCMASK) == RegNoneK)
        {
            switch (reg7b >> NBBIT_SRC)
            {
            case abcRK_nop: strcpy(sabc, ""); break; //  
            case abcRK_next_int32: strcpy(sabc, "i"); break; //       
            case abcRK_next_uint32: strcpy(sabc, "u"); break; //        
            case abcRK_next_fp32: strcpy(sabc, "f"); break; //                     
            case abcRK_next_UTF8: strcpy(sabc, "utf8"); break; //               
            case abcRK_next_UTF16: strcpy(sabc, "utf16"); break; //                      
            }
        }
        else
        {
            switch (reg7b >> NBBIT_SRC)
            {
            case abc_nop: strcpy(sabc, ""); break; //  
            case abc_const: strcpy(sabc, "K"); break; //          
            case abc_predecrement_update: strcpy(sabc, "[-1]+"); break; //          
            case abc_postincrement_update: strcpy(sabc, "(1)"); break; //                      
            case abc_preincrement_N: strcpy(sabc, "[N]"); break; //                      
            case abc_preincrement_N_update: strcpy(sabc, "[N]+"); break; //                      
            case abc_postincrement_N_update: strcpy(sabc, "(N)"); break; //                      
            case abc_increment_reg: strcpy(sabc, "Reg*"); break; //                      
            }
        }
    }


    /* ====================================================================================
        Read and pack the script until finding "end" / SECTION_END

        script_assembler
        ....
        end               end of byte codes
    */
    void nanograph_tool_read_assembler(char** pt_line, struct nanograph_platform_manifest* platform,
        struct nanograph_graph_linkedlist* graph, struct nanograph_script* script)
    {
        //    uint8_t raw_type;
        //    uint32_t nb_raw, nbytes, nbits;
        //
        //    while (1)
        //    {
        //        read_binary_param(pt_line, &(script->script_program[script->script_nb_instruction]), &raw_type, &nb_raw);
        //        if (nb_raw == 0)
        //            break;
        //        nbits = nanograph_bitsize_of_raw(raw_type);
        //        nbytes = (nbits * nb_raw)/8;
        //        script->script_nb_instruction += nbytes;
        //    }
        //
        //    script->script_nb_instruction = (3+(script->script_nb_instruction)) & 0xFFFFFFFC;   // round it to W32
        //
    }



    /* ==================================================================================== */
    void dst_srcx_register(char* s, uint32_t msb, uint32_t lsb)
    {
        char* pt_R, * pt_X, * pt_P, * pt_S, * pt_parenthesis, * pt_braket, * pt_I_end;
        char* pt_hex;
        char tmp[10];
        uint32_t reg_index, index, pt_const;
        uint32_t n, abc, Hex;
        //anydata32 data32;
        double f64;

        reg_index = RegNoneK;
        abc = abc_nop;

        /*  is it a register ? there is "r/x/p" =>  decode the index, add a word for long constant
                is there a "("   "]"  "]+"

            ELSE it is a constant => declare R15 add one words (char*)
        */

        if (s[0] == '\0')
        {
            INSERT_BITS(INST, lsb + 3, lsb, RegNoneK);
            INSERT_BITS(INST, msb, lsb + 4, abcRK_nop);
            return;
        }

        pt_S = strchr(s, 's');      // is it a stack operation ?
        pt_R = strchr(s, 'r');      // is it a data register ?
        pt_X = strchr(s, 'x');      // is it a generic register ?
        pt_P = strchr(s, 'p');      // is it a pointer register ?
        pt_hex = strstr(s, "0x");   // is it an hex constant
        pt_parenthesis = strchr(s, '(');
        pt_braket = strchr(s, '[');
        pt_const = (s[0] == '#') ||
            isdigit((unsigned char)s[0]) ||
            (s[0] == '-' && isdigit((unsigned char)s[1]));

        CONST[NB_CONST].const_dtype = DTYPE_INSTRUCTION;

        if (0 == strncmp(s, "top", 3))
        {

        }

        if (0 == strncmp(s, "push", 4))
        {
            reg_index = RegStack;
            abc = abc_predecrement_update;
        }

        if (0 == strncmp(s, "pop", 3))
        {
            reg_index = RegStack;
            abc = abc_postincrement_update;
        }

        if (pt_S)
        {
            *pt_S = 'r';        // make it "r"
            reg_index = RegStack;
        }

        if (pt_R)
        {
            pt_R++;
            tmp[0] = *pt_R++; tmp[1] = 0;
            if (isdigit(*pt_R)) {
                tmp[1] = *pt_R; tmp[2] = 0;
            }
            sscanf(tmp, "%d", &reg_index);
        }

        if (pt_X)
        {
            pt_X++;
            tmp[0] = *pt_X++; tmp[1] = 0;
            if (isdigit(*pt_X)) {
                tmp[1] = *pt_X; tmp[2] = 0;
            }
            sscanf(tmp, "%d", &reg_index);
        }

        if (pt_P)
        {
            pt_P++;
            tmp[0] = *pt_P++; tmp[1] = 0;
            if (isdigit(*pt_P)) {
                tmp[1] = *pt_P; tmp[2] = 0;
            }
            sscanf(tmp, "%d", &reg_index);
            reg_index += 10;
        }

        if (pt_hex)
        {
            if (s[0] == '#') s[0] = ' ';             // remove the "#"
            sscanf(pt_hex, "%x", &Hex);
            CONST[NB_CONST].const_dtype = DTYPE_UINT32;
            CONST[NB_CONST].data.u32 = Hex;
            reg_index = RegNoneK;
            abc = literal_dtype_to_abc(CONST[NB_CONST].const_dtype);
            NB_CONST++;
            pt_const = 0;
        }

        if (pt_const)
        {
            if (s[0] == '#') s[0] = ' ';             // remove the "#" 
            if (s[1] == '\'')
            {
                sscanf(s, "%s", CONST[NB_CONST].string);
                CONST[NB_CONST].const_dtype = DTYPE_CHAR8;
            }
            else
                if (s[1] == '\"')
                {
                    sscanf(s, "%s", CONST[NB_CONST].string);
                    CONST[NB_CONST].const_dtype = DTYPE_CHAR8;
                }
                else
                {
                    sscanf(s, "%lf", &f64);
                    if ((f64 == floor(f64) && f64 >= 0) ||   // is it an integer
                        (f64 == ceil(f64) && f64 < 0))
                    {
                        // the constant is a small integer, reg index is used for it
                        if (f64 >= (-8) && f64 <= (7))
                        {
                            reg_index = (int32_t)f64;
                            abc = abc_const;
                        }
                        else
                        {
                            if (f64 > (double)(0x7FFFFFFFL))
                            {
                                CONST[NB_CONST].const_dtype = DTYPE_UINT32;
                                CONST[NB_CONST].data.u32 = (uint32_t)f64;
                            }
                            else
                            {
                                CONST[NB_CONST].const_dtype = DTYPE_INT32;
                                CONST[NB_CONST].data.i32 = (int32_t)f64;
                            }
                            reg_index = RegNoneK;
                            abc = literal_dtype_to_abc(CONST[NB_CONST].const_dtype);
                        }
                    }
                    else
                    {
                        CONST[NB_CONST].const_dtype = DTYPE_FP32;
                        CONST[NB_CONST].data.f32 = (float)f64;
                        reg_index = RegNoneK;
                        abc = literal_dtype_to_abc(CONST[NB_CONST].const_dtype);
                    }
                }
            if (abc != abc_const) NB_CONST++;
        }


        if (pt_parenthesis) /* is there and index and () */
        {
            pt_I_end = strchr(s, ')');
            n = pt_I_end - pt_parenthesis - 1;
            memcpy(tmp, pt_parenthesis + 1, n); tmp[n] = 0;
            sscanf(tmp, "%d", &index);
            if (index == 1)     abc = abc_const;
            if (index == (-1))  abc = abc_predecrement_update;
            if (index > 1) {
                abc = abc_postincrement_update;
            }
        }

        if (pt_braket)      /* is there and index and [] */
        {
            pt_I_end = strchr(s, ']');
            n = pt_I_end - pt_braket - 1;
            memcpy(tmp, pt_braket + 1, n); tmp[n] = 0;
            sscanf(tmp, "%d", &index);
            if ('+' != pt_I_end[1] &&
                index == 1)     abc = abc_preincrement_N;

            if ('+' != pt_I_end[1] &&
                index > 1) {
                abc = abc_preincrement_N_update;
                CONST[NB_CONST].data.i32 = index;
                CONST[NB_CONST].const_dtype = DTYPE_INT32; NB_CONST++;
            }

            if ('+' == pt_I_end[1] &&
                index == 1)     abc = abc_postincrement_N_update;

            if ('+' == pt_I_end[1] &&
                index > 1) {
                abc = abc_increment_reg;
                CONST[NB_CONST].data.i32 = index;
                CONST[NB_CONST].const_dtype = DTYPE_INT32; NB_CONST++;
            }
        }


        /* save the results */
        INSERT_BITS(INST, lsb + 3, lsb, reg_index); /* 4 bits reg index */
        INSERT_BITS(INST, msb, lsb + 4, abc);       /* 3 bits qualifier */
    }


    /* ==================================================================================== */
    void format_line(char** pt_line,
        uint8_t* operationType,
        char* comments)
    {
        char* pch;
        char current_line[NBCHAR_LINE];
        int line_length, i;
        char s2[cNFIELDS][cASM];
        uint32_t isrc;          // index to the first reg field

        memset(CONST, 0, sizeof(CONST));    // clear the instruction
        INST = 0;
        NB_CONST = 0;

        memset(s, 0, sizeof(s));
        for (i = 0; i < cNFIELDS; i++) strcpy(s[i], "");
        memset(s2, 0, sizeof(s2));
        for (i = 0; i < cNFIELDS; i++) strcpy(s2[i], "");
        strcpy(current_line, "");
        memset(current_line, 0, sizeof(current_line));
        pch = strchr(*pt_line, '\n');
        line_length = (int)(pch - *pt_line);
        strncpy(current_line, *pt_line, line_length);
        current_line[line_length] = '\0';               // forced end of line
        strcpy(comments, "");
        *operationType = 0;
        isrc = 0;

        /* --- extraction of the comments for the final listing ---- */
        pch = strchr(current_line, ';');
        if (0 != pch)   // search ';' copy comments 
        {
            strncpy(comments, pch, line_length);
            pch[0] = '\0';
            pch[1] = '\n'; // now pch holds only the instruction 
        }

        /* --- LOWER CASE --- */
        line_length = strlen(current_line);
        for (i = 0; i < line_length - 1; i++)
        {
            current_line[i] = tolower(current_line[i]);
        }

        /* --- SPLIT --- */
        pch = &(current_line[0]);
        fields_extract(&pch, "cccccccccccccccccc",
            s2[0], s2[1], s2[2], s2[3], s2[4], s2[5], s2[6], s2[7], s2[8], s2[9],
            s2[10], s2[11], s2[12], s2[13], s2[14], s2[15], s2[16], s2[17]);
        pch = &(current_line[0]);

        /* --- copy the conditional field --- */
        isrc = 0;
        if (0 != strstr(pch, S_IF_YES_CLEAR)) { ST(INST, OP_COND_INST, IF_YES_CLEAR); isrc++; }
        else if (0 != strstr(pch, S_IF_NOT_CLEAR)) { ST(INST, OP_COND_INST, IF_NOT_CLEAR); isrc++; }
        else if (0 != strstr(pch, S_IF_YES)) { ST(INST, OP_COND_INST, IF_YES); isrc++; }
        else if (0 != strstr(pch, S_IF_NOT)) { ST(INST, OP_COND_INST, IF_NOT); isrc++; }
        else if (0 != strstr(pch, S_AND_IF)) { ST(INST, OP_COND_INST, AND_IF); isrc++; }
        else if (0 != strstr(pch, S_OR_IF)) { ST(INST, OP_COND_INST, OR_IF); isrc++; }


        /* --- find the operation type in pch ---
            " = "       => ALU
            " test "    => test
            else        => control
        */
        if (0 != strstr(pch, " = "))
        {
            *operationType = INST_ALU;
            strcpy(s[ALUDST], s2[isrc]);
            strcpy(s[ALUSRC1], s2[isrc + 2]);
            strcpy(s[ALUOP], s2[isrc + 3]);
            strcpy(s[ALUSRC2], s2[isrc + 4]);
            strcpy(s[ALUSRC3], s2[isrc + 5]);
        }
        else if (0 != strstr(pch, "test "))
        {
            *operationType = INST_TEST;
            isrc++;
            strcpy(s[ALUDST], s2[isrc]);
            strcpy(s[TESTIF], s2[isrc + 1]);
            strcpy(s[ALUSRC1], s2[isrc + 2]);
            strcpy(s[ALUOP], s2[isrc + 3]);
            strcpy(s[ALUSRC2], s2[isrc + 4]);
            strcpy(s[ALUSRC3], s2[isrc + 5]);
        }
        else
        {
            *operationType = INST_CTRL; // control or Label 
            strcpy(s[CTRLOP], s2[isrc]);
            strcpy(s[CTRLSRC1], s2[isrc + 1]);
            strcpy(s[CTRLSRC2], s2[isrc + 2]);
            strcpy(s[CTRLSRC3], s2[isrc + 3]);
            strcpy(s[CTRLSRC4], s2[isrc + 4]);
        }

        strncpy(*pt_line, current_line, line_length);
    }


    /* ==================================================================================== */
    void read_para_heap_labels(char** pt_line, struct nanograph_script* script,
        uint32_t* idx_l, labelPos_t* Label_positions,
        uint32_t* total_nbytes, uint32_t Param1Heap2)

    {
        uint8_t raw_type, * ptr_param, * pt0;
        uint32_t nb_raw, nbits, tmp, idx_label, nbytes;
        char* ptstart, * ptend, inputchar[200];
#define MAX_HEAP_BUFFER 10000
        char dummy_buffer[MAX_HEAP_BUFFER];
        char LabelName[NBCHAR_NANOGRAPH_NAME];

        idx_label = *idx_l;

        /* parameter data follows the code */
        if (Param1Heap2 == 1)
        {
            pt0 = ptr_param = (uint8_t*)&(script->script_program[script->script_nb_instruction]);
        }
        else
        {
            pt0 = ptr_param = dummy_buffer;
        }

        jump2next_valid_line(pt_line);
        nbytes = 0;

        /* same code as nanograph_tool_read_parameters () but with Label checks */


        while (1)
        {
            char* Label, c[10], * p;
            int i;

            /* read the header of the line : number of fields and type */
            ptstart = *pt_line;
            ptend = strchr(ptstart, '\n');
            i = (int)(ptend - ptstart);
            strncpy(inputchar, ptstart, (int)i); inputchar[i] = '\0'; inputchar[i + 1] = '\n';

            if (is_script_section_end(inputchar) ||
                (Param1Heap2 == 1 && 0 == strncmp(inputchar, script_heap, strlen(script_heap))))
            {
                break;
            }

            Label = strstr(inputchar, script_label);

            if (Label != 0)
            {
                tmp = sscanf(Label, "%s %s", c, LabelName); (void)tmp; LabelName[NBCHAR_NANOGRAPH_NAME - 1] = '\0';
                lowercase_symbol(LabelName);
                strcpy(Label_positions[idx_label].symbol, LabelName);

                Label_positions[idx_label].offset = (int)(ptr_param - pt0);
                if (Param1Heap2 == 1)
                {
                    Label_positions[idx_label].label_type = LABEL_PARAM_DECLARE;
                }
                else
                {
                    Label_positions[idx_label].label_type = LABEL_HEAP_DECLARE;
                }

                idx_label++;
            L_jump2next_valid_line:
                jump2next_line(pt_line);

                p = *pt_line;
                for (i = 0; i < NBCHAR_LINE; i++)
                {
                    if (' ' != (*p)) break;
                    p++;
                }

                if ((*p) == ';' || (*p) == '\n')
                {
                    goto L_jump2next_valid_line;
                }
                *pt_line = p;
                continue;
            }

            read_binary_param(pt_line, ptr_param, &raw_type, &nb_raw);
            if (nb_raw == 0)
                break;

            nbits = nanograph_bitsize_of_raw(raw_type);
            nbytes = (nbits * nb_raw) / 8;
            ptr_param = &(ptr_param[nbytes]);               // increment ptr_param write pointer

            if (//0 == strncmp (*pt_line,script_parameters,strlen(script_parameters)) ||
                0 == strncmp(*pt_line, script_heap, strlen(script_heap)) ||
                0 == strncmp(*pt_line, SECTION_END, strlen(SECTION_END)))
            {
                break;
            }
        }

        *idx_l = idx_label;
        *total_nbytes = (int)(ptr_param - pt0);
    }
    /* ====================================================================================
        Read and pack the macro assembler

        push = r4
        stack = r5
        push = mul pop stack
    */


    void nanograph_tool_read_code(char** pt_line, struct nanograph_platform_manifest* platform,
        struct nanograph_graph_linkedlist* graph,
        struct nanograph_script* script)
    {
        uint8_t operationType;
        char script_comment[NBCHAR_LINE];
        char LabelName[NBCHAR_NANOGRAPH_NAME];
        uint32_t Param1Heap2, nbytes;

        jump2next_valid_line(pt_line);                  // remove   "script_code"
        Param1Heap2 = script->idx_label = 0;
        strcpy(LabelName, "");
        memset(&(script->Label_positions[0]), 0, sizeof(script->Label_positions));

        while (1)
        {
            if (is_script_section_end(*pt_line) || is_script_data_section(*pt_line))
            {
                break;
            }

            /* split the instruction to s[][] and find the type */
            format_line(pt_line, &operationType, script_comment);
            jump2next_valid_line(pt_line);


            /* -------------------- label N ---------------------label L_symbol      no code--------
              s[0]      1
              Label   L_symbol
             */
            if (0 != strstr(s[0], script_label))
            {   // Save the instruction offset and the Symbol
                script->Label_positions[script->idx_label].offset = script->script_nb_instruction;
                script->Label_positions[script->idx_label].label_type = LABEL_CODE_DECLARE;
                strcpy((char*)&(
                    script->Label_positions[script->idx_label].symbol[0]), s[CTRLSRC1]);
                lowercase_symbol(script->Label_positions[script->idx_label].symbol);
                script->idx_label++;
                continue;
            }

            /* -------------------------------------------- LOAD/ALU/TEST INSTRUCTIONS -------------------
                COND   DST       SRC1        OP     SRC2               examples
                cond   <DST>    <SRC1/const> <ALU> <SRC2/const>          r1 =  r2 alu r3
                cond   <DST>    <SRC1/const> <ALU> <SRC2/const>    ifyes r1 =   K alu  K
            */

#define STO(x) ST(INST,OP_INST,x)
#define STI(x) ST(INST,OP_OPAR_INST,x)

            STO(OP_ALU);

            if (operationType == INST_TEST)
            {
                if (0 == strncmp(s[TESTIF], "==", 2)) { STO(OP_TESTEQ); }
                else if (0 == strncmp(s[TESTIF], "<=", 2)) { STO(OP_TESTLE); }
                else if (0 == strncmp(s[TESTIF], "<", 1)) { STO(OP_TESTLT); }
                else if (0 == strncmp(s[TESTIF], "!=", 2)) { STO(OP_TESTNE); }
                else if (0 == strncmp(s[TESTIF], ">=", 2)) { STO(OP_TESTGE); }
                else if (0 == strncmp(s[TESTIF], ">", 1)) { STO(OP_TESTGT); }
            }

            if ((operationType == INST_TEST) || (operationType == INST_ALU))
            {
                dst_srcx_register(s[ALUDST], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                dst_srcx_register(s[ALUSRC1], OP_SRC1_INST_MSB, OP_SRC1_INST_LSB);
                dst_srcx_register(s[ALUSRC2], OP_SRC2_INST_MSB, OP_SRC2_INST_LSB);

                if (s[ALUOP][0] == '\0') { STI(OPAR_NOP); }
                if (0 == strncmp(s[ALUOP], "+", 1)) { STI(OPAR_ADD); }
                if (0 == strncmp(s[ALUOP], "-", 1)) { STI(OPAR_SUB); }
                if (0 == strncmp(s[ALUOP], "*", 1)) { STI(OPAR_MUL); }
                if (0 == strncmp(s[ALUOP], "/", 1)) { STI(OPAR_DIV); }
                if (0 == strncmp(s[ALUOP], ">>", 2)) { STI(OPAR_LRSHFT); }
                if (0 == strncmp(s[ALUOP], "|", 1)) { STI(OPAR_OR); }
                if (0 == strncmp(s[ALUOP], "no", 2)) { STI(OPAR_NOR); }
                if (0 == strncmp(s[ALUOP], "&", 1)) { STI(OPAR_AND); }
                if (0 == strncmp(s[ALUOP], "^", 1)) { STI(OPAR_XOR); }
                if (0 == strncmp(s[ALUOP], "ma", 2)) { STI(OPAR_MAX); }
                if (0 == strncmp(s[ALUOP], "mi", 2)) { STI(OPAR_MIN); }
                if (0 == strncmp(s[ALUOP], "mo", 2)) { STI(OPAR_MOD); }
                if (0 == strncmp(s[ALUOP], "ad", 2)) { STI(OPAR_ADDMOD); }
                if (0 == strncmp(s[ALUOP], "su", 2)) { STI(OPAR_SUBMOD); }
                if (0 == strncmp(s[ALUOP], "wr", 2)) { STI(OPAR_WRBF); }
                if (0 == strncmp(s[ALUOP], "rd", 2)) { STI(OPAR_RDBF); }
                if (0 == strncmp(s[ALUOP], "sw", 2)) { STI(OPAR_SWAP); }
                if (0 == strncmp(s[ALUOP], "ab", 2)) { STI(OPAR_ABS); }
            }
            else
            {
                /* control instructions */
                ST(INST, OP_INST, OP_CTRL);

                /*  COND  CTRLOP   DST     SRC1         SRC2               examples
                    cond           <DST>  <SRC1/const> <SRC2/const>          set  R2 type float
                    cond           <DST>  <SRC1/const> <SRC2/const>    ifyes jump #L2

                 1           2             3           4         5         6
                 save       <register> <register> <register> <register> <register>
                 restore    <register> <register> <register> <register> <register>
                 jump       <Label>    <register> <register> <register>
                 banz       <Label>    <register>
                 call       <Label>    <register> <register> <register>
                 callsys    K          <register> <register> <register>

                  1           2             3           4         5
                 set     <register>  <type/typeptr>     #type                OPLJ_SET
                 set     <register>  <base/size>        <register/number>
                 set     <register>  <heap/param/graph> <register/number>
                */
                if (0 == strncmp(s[CTRLOP], "set", 3))
                {
                    STI(OPLJ_SET);
                    dst_srcx_register(s[CTRLSRC1], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);

                    if (0 == strncmp(s[CTRLSRC2], "ty", 2)) { INSERT_BITS(INST, OP_SRC0_INST_MSB, OP_SRC0_INST_LSB + 4, PTR_SET_DTYPE); }
                    if (0 == strncmp(s[CTRLSRC2], "ba", 2)) { INSERT_BITS(INST, OP_SRC0_INST_MSB, OP_SRC0_INST_LSB + 4, PTR_SET_BASE); }
                    if (0 == strncmp(s[CTRLSRC2], "si", 2)) { INSERT_BITS(INST, OP_SRC0_INST_MSB, OP_SRC0_INST_LSB + 4, PTR_SET_SIZE); }
                    if (0 == strncmp(s[CTRLSRC2], "ab", 2)) { INSERT_BITS(INST, OP_SRC0_INST_MSB, OP_SRC0_INST_LSB + 4, PTR_MEMBANK_ABS); }
                    if (0 == strncmp(s[CTRLSRC2], "ar", 2)) { INSERT_BITS(INST, OP_SRC0_INST_MSB, OP_SRC0_INST_LSB + 4, PTR_MEMBANK_ARC); }
                    if (0 == strncmp(s[CTRLSRC2], "pa", 2)) { INSERT_BITS(INST, OP_SRC0_INST_MSB, OP_SRC0_INST_LSB + 4, PTR_MEMBANK_PARAM); }
                    if (0 == strncmp(s[CTRLSRC2], "he", 2)) { INSERT_BITS(INST, OP_SRC0_INST_MSB, OP_SRC0_INST_LSB + 4, PTR_MEMBANK_HEAP); }

                    if ((0 == strncmp(s[CTRLSRC2], "pa", 2)) || (0 == strncmp(s[CTRLSRC2], "he", 2)))
                    {
                        encode_next_u32_operand(OP_SRC1_INST_MSB, OP_SRC1_INST_LSB, 0);
                        remember_label_use(script, s[CTRLSRC3], script->script_nb_instruction + 1 + NB_CONST - 1,
                            (0 == strncmp(s[CTRLSRC2], "pa", 2)) ? LABEL_PARAM_USE : LABEL_HEAP_USE);
                    }
                    else
                    {
                        dst_srcx_register(s[CTRLSRC3], OP_SRC1_INST_MSB, OP_SRC1_INST_LSB);
                    }
                }

                if (0 == strncmp(s[CTRLOP], "ju", 2))
                {
                    STI(OPLJ_JUMP);
                    dst_srcx_register(s[CTRLSRC2], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                    dst_srcx_register(s[CTRLSRC3], OP_SRC1_INST_MSB, OP_SRC1_INST_LSB);
                    encode_next_u32_operand(OP_SRC2_INST_MSB, OP_SRC2_INST_LSB, 0);
                    remember_label_use(script, s[CTRLSRC1], script->script_nb_instruction + 1 + NB_CONST - 1, LABEL_CODE_USE);
                }
                if (0 == strncmp(s[CTRLOP], "ba", 2))
                {
                    STI(OPLJ_BANZ);
                    dst_srcx_register(s[CTRLSRC2], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                    encode_next_u32_operand(OP_SRC2_INST_MSB, OP_SRC2_INST_LSB, 0);
                    remember_label_use(script, s[CTRLSRC1], script->script_nb_instruction + 1 + NB_CONST - 1, LABEL_CODE_USE);
                }
                if (0 == strncmp(s[CTRLOP], "ca", 2))
                {
                    STI(OPLJ_CALL);
                    dst_srcx_register(s[CTRLSRC2], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                    dst_srcx_register(s[CTRLSRC3], OP_SRC1_INST_MSB, OP_SRC1_INST_LSB);
                    encode_next_u32_operand(OP_SRC2_INST_MSB, OP_SRC2_INST_LSB, 0);
                    remember_label_use(script, s[CTRLSRC1], script->script_nb_instruction + 1 + NB_CONST - 1, LABEL_CODE_USE);
                }
                if (0 == strncmp(s[CTRLOP], "sy", 2))
                {
                    STI(OPLJ_SYSCALL);
                    dst_srcx_register(s[CTRLSRC1], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                    dst_srcx_register(s[CTRLSRC2], OP_SRC1_INST_MSB, OP_SRC1_INST_LSB);
                    dst_srcx_register(s[CTRLSRC3], OP_SRC2_INST_MSB, OP_SRC2_INST_LSB);
                }
                if (0 == strncmp(s[CTRLOP], "sa", 2))
                {
                    STI(OPLJ_SAVE);
                    dst_srcx_register(s[CTRLSRC1], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                    dst_srcx_register(s[CTRLSRC2], OP_SRC1_INST_MSB, OP_SRC1_INST_LSB);
                    dst_srcx_register(s[CTRLSRC3], OP_SRC2_INST_MSB, OP_SRC2_INST_LSB);
                }
                if (0 == strncmp(s[CTRLOP], "restore", 7))
                {
                    STI(OPLJ_RESTORE);
                    dst_srcx_register(s[CTRLSRC1], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                    dst_srcx_register(s[CTRLSRC2], OP_SRC1_INST_MSB, OP_SRC1_INST_LSB);
                    dst_srcx_register(s[CTRLSRC3], OP_SRC2_INST_MSB, OP_SRC2_INST_LSB);
                }
                if (0 == strncmp(s[CTRLOP], "return", 6))
                {
                    STI(OPLJ_RETURN);
                }
                if (0 == strncmp(s[CTRLOP], "pa", 2))
                {
                    STI(OPLJ_PARAM);
                    dst_srcx_register(s[CTRLSRC1], OP_SRC0_INST_MSB, OP_SRC0_INST_LSB);
                }
            }

            // save byte-codes and corresponding comments        
            strcpy(script->script_comments[script->script_nb_instruction], script_comment);
            script->script_program[script->script_nb_instruction] = INST;
            script->script_program_type[script->script_nb_instruction] = DTYPE_INSTRUCTION;

            /* save the constants */
            script->script_nb_instruction++;
            {
                int i;
                for (i = 0; i < NB_CONST; i++)
                {
                    script->script_program[script->script_nb_instruction] = CONST[i].data.i32;
                    script->script_program_type[script->script_nb_instruction] = CONST[i].const_dtype;
                    script->script_nb_instruction++;
                }
            }
            //if (0 == strncmp (*pt_line,script_parameters,strlen(script_parameters)) ||
            //    0 == strncmp (*pt_line,script_heap,strlen(script_heap)) || 
            //    0 == strncmp (*pt_line,SECTION_END,strlen(SECTION_END)) )
            //{   break;
            //}
        }       /* while (1) */

        /*--------------------------------------------------------------------------------------------------------*/

        script->code_param32 = script->script_nb_instruction;

    L_check_heap:
        if (is_script_data_section(*pt_line))
        {
            Param1Heap2 = 0;
            if ((0 == strncmp(*pt_line, script_parameters, strlen(script_parameters))) ||
                (0 == strncmp(*pt_line, script_parameter, strlen(script_parameter)))) Param1Heap2 = 1;
            if (0 == strncmp(*pt_line, script_heap, strlen(script_heap))) Param1Heap2 = 2;

            read_para_heap_labels(pt_line, script, &(script->idx_label), script->Label_positions, &nbytes, Param1Heap2);

            if (Param1Heap2 == 1)
            {
                script->script_nb_instruction += (3 + nbytes) / 4;
                script->code_param32 = script->script_nb_instruction;
            }
            else if (Param1Heap2 == 2)
            {
                if (nbytes > script->ram_heap_size)
                {
                    script->ram_heap_size = nbytes;
                }
            }
            goto L_check_heap;
        }

        if (is_script_section_end(*pt_line))
        {
            jump2next_valid_line(pt_line);
        }


        /*
            Second pass : find the L_symbol labels
                    Label_positions[idx_label].position = script->script_nb_instruction;
                    strcpy(Label_positions[idx_label].symbol, LabelName);
        */
        {
            uint32_t ijump, ilabel;
            int label_position, instruction_position;
            uint32_t* instruction;

            /* replacement of Label of load jump call */
            for (ilabel = 0; ilabel < script->idx_label; ilabel++)
            {
                if (script->Label_positions[ilabel].label_type != LABEL_CODE_DECLARE)
                {
                    continue; /* find Labels to place */
                }
                for (ijump = 0; ijump < script->idx_label; ijump++)
                {
                    if (script->Label_positions[ijump].label_type == LABEL_CODE_USE)
                    {
                        // comparison of label name, then update the instruction 
                        if (0 == strcmp(script->Label_positions[ilabel].symbol, script->Label_positions[ijump].symbol))
                        {
                            label_position = script->Label_positions[ilabel].offset;
                            instruction_position = script->Label_positions[ijump].offset;
                            instruction = &(script->script_program[instruction_position]);
                            *instruction = (uint32_t)label_position;
                        }
                    }
                }
            }

            /* replacement of Label of set r label/heap , instruction using 2 words */
            for (ilabel = 0; ilabel < script->idx_label; ilabel++)
            {
                if (script->Label_positions[ilabel].label_type == LABEL_HEAP_DECLARE ||
                    script->Label_positions[ilabel].label_type == LABEL_PARAM_DECLARE)
                {
                    /* label is LABEL_HEAP_DECLARE or LABEL_PARAM_DECLARE
                       find the instruction using it */
                    for (ijump = 0; ijump < script->idx_label; ijump++)
                    {
                        if (script->Label_positions[ijump].label_type == LABEL_HEAP_USE ||
                            script->Label_positions[ijump].label_type == LABEL_PARAM_USE)
                        {
                            if (0 == strcmp(script->Label_positions[ilabel].symbol, script->Label_positions[ijump].symbol))
                            {
                                label_position = script->Label_positions[ilabel].offset;
                                instruction_position = script->Label_positions[ijump].offset;
                                instruction = &(script->script_program[instruction_position]);
                                *instruction = label_position;  // 32bit address
                            }
                        }
                    }
                }
            }
        }
    }



#ifdef __cplusplus
}
#endif
