#include "yaml_platform.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <errno.h>

static void yp_copy(char *dst, int size, const char *src)
{
    int n;
    if (size <= 0) return;
    if (src == NULL) src = "";
    n = (int)strlen(src);
    if (n >= size) n = size - 1;
    memcpy(dst, src, (size_t)n);
    dst[n] = '\0';
}

static char *yp_ltrim(char *s)
{
    while ((*s == ' ') || (*s == '\t')) ++s;
    return s;
}

static void yp_rtrim(char *s)
{
    int n;
    n = (int)strlen(s);
    while ((n > 0) && ((s[n-1] == ' ') || (s[n-1] == '\t') ||
                       (s[n-1] == '\r') || (s[n-1] == '\n')))
        s[--n] = '\0';
}

static void yp_strip_comment(char *s)
{
    int i;
    int quote;
    quote = 0;
    for (i = 0; s[i] != '\0'; ++i)
    {
        if ((s[i] == '\'') || (s[i] == '"'))
        {
            if (quote == 0) quote = (int)s[i];
            else if (quote == (int)s[i]) quote = 0;
        }
        else if ((s[i] == '#') && (quote == 0))
        {
            s[i] = '\0';
            break;
        }
    }
    yp_rtrim(s);
}

static int yp_indent(const char *s)
{
    int n;
    n = 0;
    while (*s == ' ') { ++n; ++s; }
    return n;
}

static int yp_key_value(char *text, char **key, char **value)
{
    char *p;
    p = strchr(text, ':');
    if (p == NULL) return 0;
    *p = '\0';
    yp_rtrim(text);
    *key = yp_ltrim(text);
    *value = yp_ltrim(p + 1);
    yp_rtrim(*value);
    return 1;
}

static void yp_unquote(char *s)
{
    int n;
    n = (int)strlen(s);
    if ((n >= 2) && (((s[0] == '"') && (s[n-1] == '"')) ||
                     ((s[0] == '\'') && (s[n-1] == '\''))))
    {
        memmove(s, s + 1, (size_t)(n - 2));
        s[n-2] = '\0';
    }
}

static int yp_int(const char *s, int *v)
{
    char *end;
    long x;
    errno = 0;
    x = strtol(s, &end, 0);
    while (isspace((unsigned char)*end)) ++end;
    if ((end == s) || (*end != '\0') || (errno != 0)) return 0;
    *v = (int)x;
    return 1;
}

static int yp_ulong(const char *s, unsigned long *v)
{
    char *end;
    unsigned long x;
    errno = 0;
    x = strtoul(s, &end, 0);
    while (isspace((unsigned char)*end)) ++end;
    if ((end == s) || (*end != '\0') || (errno != 0)) return 0;
    *v = x;
    return 1;
}

static int yp_double(const char *s, double *v)
{
    char *end;
    double x;
    errno = 0;
    x = strtod(s, &end);
    while (isspace((unsigned char)*end)) ++end;
    if ((end == s) || (*end != '\0') || (errno != 0)) return 0;
    *v = x;
    return 1;
}

static int yp_string_list(const char *src, YP_StringList *list)
{
    char tmp[YP_MAX_LINE];
    char *p;
    char *q;
    int n;
    list->count = 0;
    yp_copy(tmp, (int)sizeof(tmp), src);
    p = yp_ltrim(tmp);
    n = (int)strlen(p);
    if ((n < 2) || (p[0] != '[') || (p[n-1] != ']')) return 0;
    p[n-1] = '\0';
    ++p;
    while (*p != '\0')
    {
        p = yp_ltrim(p);
        q = strchr(p, ',');
        if (q != NULL) *q = '\0';
        yp_rtrim(p);
        yp_unquote(p);
        if (*p != '\0')
        {
            if (list->count >= YP_MAX_VALUES) return 0;
            yp_copy(list->value[list->count], YP_MAX_VALUE, p);
            ++list->count;
        }
        if (q == NULL) break;
        p = q + 1;
    }
    return 1;
}

static int yp_number_list(const char *src, YP_NumberList *list)
{
    YP_StringList sl;
    int i;
    if (!yp_string_list(src, &sl)) return 0;
    list->count = 0;
    for (i = 0; i < sl.count; ++i)
    {
        if (!yp_double(sl.value[i], &list->value[i])) return 0;
        ++list->count;
    }
    return 1;
}

static void yp_error(YP_PlatformManifest *m, int line, const char *text)
{
    m->error_line = line;
    yp_copy(m->error_text, YP_MAX_TEXT, text);
}

static int yp_set_path(YP_FilePath *p, const char *key, char *value)
{
    if (strcmp(key,"path_to") == 0) yp_copy(p->path_to,YP_MAX_NAME,value);
    else if (strcmp(key,"index") == 0)
    { if(!yp_int(value,&p->index)) return 0; p->present |= YP_PATH_HAS_INDEX; }
    else if (strcmp(key,"path") == 0)
    { yp_copy(p->path,YP_MAX_PATH,value); p->present |= YP_PATH_HAS_PATH; }
    return 1;
}

static int yp_set_node(YP_AvailableNode *n, const char *key, char *value)
{
    if (strcmp(key,"path") == 0)
    { if(!yp_int(value,&n->path)) return 0; n->present |= YP_NODE_HAS_PATH; }
    else if (strcmp(key,"index") == 0)
    { if(!yp_int(value,&n->index)) return 0; n->present |= YP_NODE_HAS_INDEX; }
    else if (strcmp(key,"name") == 0) yp_copy(n->name,YP_MAX_NAME,value);
    return 1;
}

static int yp_set_processor(YP_Processor *p, const char *key, char *value)
{
    if (strcmp(key,"archID") == 0)
    { yp_copy(p->archID,YP_MAX_VALUE,value); p->present |= YP_PROC_HAS_ARCH; }
    else if (strcmp(key,"procID") == 0)
    { if(!yp_int(value,&p->procID)) return 0; p->present |= YP_PROC_HAS_ID; }
    else if (strcmp(key,"cacheLine") == 0)
    { if(!yp_int(value,&p->cacheLine)) return 0; p->present |= YP_PROC_HAS_CACHELINE; }
    else if (strcmp(key,"computeServices") == 0)
    { if(!yp_int(value,&p->computeServices)) return 0; p->present |= YP_PROC_HAS_COMPUTE; }
    return 1;
}

static int yp_set_subblock(YP_Subblock *s, const char *key, char *value)
{
    if (strcmp(key,"index") == 0)
    { if(!yp_int(value,&s->index)) return 0; s->present |= YP_SUB_HAS_INDEX; }
    else if (strcmp(key,"name") == 0)
    { yp_copy(s->name,YP_MAX_NAME,value); s->present |= YP_SUB_HAS_NAME; }
    else if (strcmp(key,"base") == 0)
    { if(!yp_ulong(value,&s->base)) return 0; s->present |= YP_SUB_HAS_BASE; }
    else if (strcmp(key,"size") == 0)
    { if(!yp_ulong(value,&s->size)) return 0; s->present |= YP_SUB_HAS_SIZE; }
    return 1;
}

static int yp_set_memory(YP_Memory *m, const char *key, char *value)
{
    if (strcmp(key,"memory") == 0) yp_copy(m->name,YP_MAX_NAME,value);
    else if (strcmp(key,"index") == 0)
    { if(!yp_int(value,&m->index)) return 0; m->present |= YP_MEM_HAS_INDEX; }
    else if (strcmp(key,"size") == 0)
    { if(!yp_ulong(value,&m->size)) return 0; m->present |= YP_MEM_HAS_SIZE; }
    else if (strcmp(key,"access") == 0)
    { if(!yp_int(value,&m->access)) return 0; m->present |= YP_MEM_HAS_ACCESS; }
    else if (strcmp(key,"speed") == 0)
    { if(!yp_int(value,&m->speed)) return 0; m->present |= YP_MEM_HAS_SPEED; }
    else if (strcmp(key,"type") == 0)
    { if(!yp_int(value,&m->type)) return 0; m->present |= YP_MEM_HAS_TYPE; }
    else if (strcmp(key,"instance") == 0)
    { if(!yp_int(value,&m->instance)) return 0; m->present |= YP_MEM_HAS_INSTANCE; }
    return 1;
}

static int yp_set_instance(YP_InterpreterInstance *p, const char *key, char *value)
{
    if (strcmp(key,"instance") == 0) yp_copy(p->name,YP_MAX_NAME,value);
    else if (strcmp(key,"index") == 0)
    { if(!yp_int(value,&p->index)) return 0; p->present |= YP_INST_HAS_INDEX; }
    else if (strcmp(key,"archID") == 0)
    { yp_copy(p->archID,YP_MAX_VALUE,value); p->present |= YP_INST_HAS_ARCH; }
    else if (strcmp(key,"procID") == 0)
    { if(!yp_int(value,&p->procID)) return 0; p->present |= YP_INST_HAS_PROCID; }
    else if (strcmp(key,"priority") == 0)
    { if(!yp_int(value,&p->priority)) return 0; p->present |= YP_INST_HAS_PRIORITY; }
    else if (strcmp(key,"trace_depth") == 0)
    { if(!yp_int(value,&p->trace_depth)) return 0; p->present |= YP_INST_HAS_TRACE_DEPTH; }
    else if (strcmp(key,"trace_verbosity") == 0)
    { if(!yp_int(value,&p->trace_verbosity)) return 0; p->present |= YP_INST_HAS_TRACE_VERB; }
    else if (strcmp(key,"memory_isolation") == 0)
    { if(!yp_int(value,&p->memory_isolation)) return 0; p->present |= YP_INST_HAS_ISOLATION; }
    return 1;
}

static int yp_set_interface(YP_Interface *p, const char *key, char *value)
{
    if (strcmp(key,"path") == 0)
    { if(!yp_int(value,&p->path)) return 0; p->present |= YP_IF_HAS_PATH; }
    else if (strcmp(key,"index") == 0)
    { if(!yp_int(value,&p->index)) return 0; p->present |= YP_IF_HAS_INDEX; }
    else if (strcmp(key,"c_platform_index") == 0)
    { if(!yp_int(value,&p->c_platform_index)) return 0; p->present |= YP_IF_HAS_C_PLATFORM_INDEX; }
    else if (strcmp(key,"name") == 0) yp_copy(p->name,YP_MAX_NAME,value);
    else if (strcmp(key,"direction") == 0)
    { yp_copy(p->direction,YP_MAX_VALUE,value); p->present |= YP_IF_HAS_DIRECTION; }
    else if (strcmp(key,"domain") == 0)
    { yp_copy(p->domain,YP_MAX_VALUE,value); p->present |= YP_IF_HAS_DOMAIN; }
    else if (strcmp(key,"protocol") == 0)
    { yp_copy(p->protocol,YP_MAX_VALUE,value); p->present |= YP_IF_HAS_PROTOCOL; }
    else if (strcmp(key,"malloc") == 0)
    { yp_copy(p->malloc_mode,YP_MAX_VALUE,value); p->present |= YP_IF_HAS_MALLOC; }
    else if (strcmp(key,"set0copy1") == 0)
    { yp_copy(p->set0copy1,YP_MAX_VALUE,value); p->present |= YP_IF_HAS_SET0COPY1; }
    else if (strcmp(key,"setup_time") == 0)
    { if(!yp_double(value,&p->setup_time)) return 0; p->present |= YP_IF_HAS_SETUP_TIME; }
    return 1;
}

static int yp_set_constraint(YP_Interface *p, int group, const char *key, char *value)
{
    YP_NumberConstraint *n;
    if (group == 0)
    {
        if (strcmp(key,"interleaving") == 0)
        { yp_copy(p->format.interleaving,YP_MAX_VALUE,value); p->format.present |= YP_FMT_HAS_INTERLEAVING; }
        else if (strcmp(key,"samprt_percent_accuracy") == 0)
        { if(!yp_double(value,&p->format.sample_rate_accuracy)) return 0; p->format.present |= YP_FMT_HAS_RATE_ACCURACY; }
        return 1;
    }
    if (group == 1)
    {
        if (strcmp(key,"default") == 0)
        { yp_copy(p->format.data_type.default_value,YP_MAX_VALUE,value); p->format.data_type.present |= YP_DTYPE_HAS_DEFAULT; }
        else if (strcmp(key,"values") == 0)
        { if(!yp_string_list(value,&p->format.data_type.values)) return 0; p->format.data_type.present |= YP_DTYPE_HAS_VALUES; }
        return 1;
    }
    if (group == 2) n=&p->format.frame_length;
    else if (group == 3) n=&p->format.sample_rate;
    else if (group == 4) n=&p->format.nb_channels;
    else return 1;

    if (strcmp(key,"type") == 0)
    { yp_copy(n->type,YP_MAX_VALUE,value); n->present |= YP_NUM_HAS_TYPE; }
    else if (strcmp(key,"default") == 0)
    { if(!yp_double(value,&n->default_value)) return 0; n->present |= YP_NUM_HAS_DEFAULT; }
    else if (strcmp(key,"values") == 0)
    { if(!yp_number_list(value,&n->values)) return 0; n->present |= YP_NUM_HAS_VALUES; }
    return 1;
}

int yp_read_file(const char *filename, YP_PlatformManifest *m)
{
    FILE *fp;
    char line[YP_MAX_LINE];
    char work[YP_MAX_LINE];
    char *text;
    char *key;
    char *value;
    int line_no;
    int ind;
    int section;
    int ipath;
    int iproc;
    int inode;
    int imem;
    int isub;
    int iinst;
    int iif;
    int fmt_group;

    enum { S_TOP=0, S_PATHS, S_PROCESSORS, S_MEMORIES, S_INSTANCES };

    if ((filename == NULL) || (m == NULL)) return YP_ERR_SYNTAX;
    memset(m,0,sizeof(*m));
    ipath=iproc=inode=imem=isub=iinst=iif=-1;
    fmt_group=0;
    section=S_TOP;

    fp=fopen(filename,"r");
    if (fp == NULL) return YP_ERR_OPEN;

    line_no=0;
    while (fgets(line,(int)sizeof(line),fp) != NULL)
    {
        ++line_no;
        if ((strchr(line,'\n') == NULL) && !feof(fp))
        { fclose(fp); yp_error(m,line_no,"line too long"); return YP_ERR_LINE_TOO_LONG; }
        yp_copy(work,(int)sizeof(work),line);
        yp_strip_comment(work);
        if (yp_ltrim(work)[0] == '\0') continue;
        ind=yp_indent(work);
        text=yp_ltrim(work);

        if (ind == 0)
        {
            section=S_TOP; ipath=iproc=inode=imem=isub=iinst=iif=-1; fmt_group=0;
            if (!yp_key_value(text,&key,&value))
            { fclose(fp); yp_error(m,line_no,"expected top-level key"); return YP_ERR_SYNTAX; }
            yp_unquote(value);
            if (strcmp(key,"platform") == 0) yp_copy(m->platform,YP_MAX_NAME,value);
            else if (strcmp(key,"version") == 0)
            { if(!yp_int(value,&m->version)) goto badnum; m->present |= YP_PLATFORM_HAS_VERSION; }
            else if (strcmp(key,"description") == 0)
            { yp_copy(m->description,YP_MAX_TEXT,value); m->present |= YP_PLATFORM_HAS_DESCRIPTION; }
            else if (strcmp(key,"file_paths") == 0) section=S_PATHS;
            else if (strcmp(key,"processors") == 0) section=S_PROCESSORS;
            else if (strcmp(key,"memories") == 0) section=S_MEMORIES;
            else if (strcmp(key,"interpreter_instances") == 0) section=S_INSTANCES;
            continue;
        }

        if (section == S_PATHS)
        {
            if ((ind == 2) && (text[0] == '-'))
            {
                if (m->file_path_count >= YP_MAX_FILE_PATHS) goto toomany;
                ipath=m->file_path_count++;
                memset(&m->file_path[ipath],0,sizeof(YP_FilePath));
                text=yp_ltrim(text+1);
                if ((*text!='\0') && yp_key_value(text,&key,&value))
                { yp_unquote(value); if(!yp_set_path(&m->file_path[ipath],key,value)) goto badnum; }
            }
            else if ((ind >= 4) && (ipath >= 0) && yp_key_value(text,&key,&value))
            { yp_unquote(value); if(!yp_set_path(&m->file_path[ipath],key,value)) goto badnum; }
        }
        else if (section == S_PROCESSORS)
        {
            if ((ind == 2) && (text[0] == '-'))
            {
                if (m->processor_count >= YP_MAX_PROCESSORS) goto toomany;
                iproc=m->processor_count++; inode=-1;
                memset(&m->processor[iproc],0,sizeof(YP_Processor));
                text=yp_ltrim(text+1);
                if ((*text!='\0') && yp_key_value(text,&key,&value))
                {
                    yp_unquote(value);
                    if ((strcmp(key,"processor") != 0) && !yp_set_processor(&m->processor[iproc],key,value)) goto badnum;
                }
            }
            else if ((ind == 4) && (iproc >= 0) && yp_key_value(text,&key,&value))
            {
                yp_unquote(value);
                if (strcmp(key,"nodes") != 0)
                    if(!yp_set_processor(&m->processor[iproc],key,value)) goto badnum;
            }
            else if ((ind == 6) && (text[0] == '-') && (iproc >= 0))
            {
                if (m->processor[iproc].node_count >= YP_MAX_NODES_PER_PROC) goto toomany;
                inode=m->processor[iproc].node_count++;
                memset(&m->processor[iproc].node[inode],0,sizeof(YP_AvailableNode));
                text=yp_ltrim(text+1);
                if ((*text!='\0') && yp_key_value(text,&key,&value))
                {
                    yp_unquote(value);
                    if ((strcmp(key,"node") != 0) && !yp_set_node(&m->processor[iproc].node[inode],key,value)) goto badnum;
                }
            }
            else if ((ind >= 8) && (iproc >= 0) && (inode >= 0) && yp_key_value(text,&key,&value))
            { yp_unquote(value); if(!yp_set_node(&m->processor[iproc].node[inode],key,value)) goto badnum; }
        }
        else if (section == S_MEMORIES)
        {
            if ((ind == 2) && (text[0] == '-'))
            {
                if (m->memory_count >= YP_MAX_MEMORIES) goto toomany;
                imem=m->memory_count++; isub=-1;
                memset(&m->memory[imem],0,sizeof(YP_Memory));
                text=yp_ltrim(text+1);
                if ((*text!='\0') && yp_key_value(text,&key,&value))
                { yp_unquote(value); 
        /* fprintf(stderr, "\n ind == 2 VALUE %s\n",value);            */
                  if(!yp_set_memory(&m->memory[imem],key,value)) goto badnum; 
                }
            }
            else if ((ind == 4) && (imem >= 0) && yp_key_value(text,&key,&value))
            {
                yp_unquote(value);
        /* fprintf(stderr, "\n ind == 4 TEXT %s  KEY %s VALUE %s \n",text, key, value);           */
                if (strcmp(key,"subblocks") != 0)
                    if(!yp_set_memory(&m->memory[imem],key,value)) goto badnum;
            }
            else if ((ind == 6) && (text[0] == '-') && (imem >= 0))
            {
                if (m->memory[imem].subblock_count >= YP_MAX_SUBBLOCKS) goto toomany;
                isub=m->memory[imem].subblock_count++;
                memset(&m->memory[imem].subblock[isub],0,sizeof(YP_Subblock));
                text=yp_ltrim(text+1);
                if ((*text!='\0') && yp_key_value(text,&key,&value))
                {
        /* fprintf(stderr, "\n ind == 6 VALUE %s\n",value); */
                    
                    yp_unquote(value);
                    if ((strcmp(key,"subblock") != 0) && !yp_set_subblock(&m->memory[imem].subblock[isub],key,value)) goto badnum;
                }
            }
            else if ((ind >= 8) && (imem >= 0) && (isub >= 0) && yp_key_value(text,&key,&value))
            { yp_unquote(value); 
        /* fprintf(stderr, "\n ind>=8 VALUE %s\n",value); */
              if(!yp_set_subblock(&m->memory[imem].subblock[isub],key,value)) goto badnum; 
            }
        }
        else if (section == S_INSTANCES)
        {
            if ((ind == 2) && (text[0] == '-'))
            {
                if (m->instance_count >= YP_MAX_INSTANCES) goto toomany;
                iinst=m->instance_count++; iif=-1; fmt_group=0;
                memset(&m->instance[iinst],0,sizeof(YP_InterpreterInstance));
                text=yp_ltrim(text+1);
                if ((*text!='\0') && yp_key_value(text,&key,&value))
                { yp_unquote(value); if(!yp_set_instance(&m->instance[iinst],key,value)) goto badnum; }
            }
            else if ((ind == 4) && (iinst >= 0) && yp_key_value(text,&key,&value))
            {
                yp_unquote(value);
                if (strcmp(key,"interfaces") != 0)
                    if(!yp_set_instance(&m->instance[iinst],key,value)) goto badnum;
            }
            else if ((ind == 6) && (text[0] == '-') && (iinst >= 0))
            {
                if (m->instance[iinst].interface_count >= YP_MAX_INTERFACES) goto toomany;
                iif=m->instance[iinst].interface_count++; fmt_group=0;
                memset(&m->instance[iinst].interface[iif],0,sizeof(YP_Interface));
                yp_copy(m->instance[iinst].interface[iif].protocol,YP_MAX_VALUE,"servant");
                yp_copy(m->instance[iinst].interface[iif].malloc_mode,YP_MAX_VALUE,"platform");
                yp_copy(m->instance[iinst].interface[iif].set0copy1,YP_MAX_VALUE,"set");
                m->instance[iinst].interface[iif].setup_time=0.0;
                text=yp_ltrim(text+1);
                if ((*text!='\0') && yp_key_value(text,&key,&value))
                {
                    yp_unquote(value);
                    if ((strcmp(key,"interface") != 0) && !yp_set_interface(&m->instance[iinst].interface[iif],key,value)) goto badnum;
                }
            }
            else if ((ind == 8) && (iinst >= 0) && (iif >= 0) && yp_key_value(text,&key,&value))
            {
                yp_unquote(value); fmt_group=0;
                if (strcmp(key,"format") != 0)
                    if(!yp_set_interface(&m->instance[iinst].interface[iif],key,value)) goto badnum;
            }
            else if ((ind == 10) && (iinst >= 0) && (iif >= 0) && yp_key_value(text,&key,&value))
            {
                yp_unquote(value);
                if (strcmp(key,"data_type") == 0) fmt_group=1;
                else if (strcmp(key,"frame_length") == 0) fmt_group=2;
                else if (strcmp(key,"sample_rate") == 0) fmt_group=3;
                else if (strcmp(key,"nb_channels") == 0) fmt_group=4;
                else { fmt_group=0; if(!yp_set_constraint(&m->instance[iinst].interface[iif],0,key,value)) goto badnum; }
            }
            else if ((ind >= 12) && (iinst >= 0) && (iif >= 0) && (fmt_group != 0) && yp_key_value(text,&key,&value))
            { yp_unquote(value); if(!yp_set_constraint(&m->instance[iinst].interface[iif],fmt_group,key,value)) goto badnum; }
        }
    }

    fclose(fp);
    if (m->platform[0] == '\0')
    { yp_error(m,0,"missing platform name"); return YP_ERR_SYNTAX; }
    return YP_OK;

badnum:
    fclose(fp); yp_error(m,line_no,"invalid numeric/list value"); return YP_ERR_BAD_NUMBER;
toomany:
    fclose(fp); yp_error(m,line_no,"too many manifest items"); return YP_ERR_TOO_MANY;
}

const YP_Processor *yp_find_processor(const YP_PlatformManifest *m,
                                      const char *archID, int procID)
{
    int i;
    if ((m == NULL) || (archID == NULL)) return NULL;
    for (i=0;i<m->processor_count;++i)
        if ((strcmp(m->processor[i].archID,archID)==0) && (m->processor[i].procID==procID))
            return &m->processor[i];
    return NULL;
}

const YP_Memory *yp_find_memory(const YP_PlatformManifest *m,
                                const char *name, int index)
{
    int i;
    if ((m == NULL) || (name == NULL)) return NULL;
    for (i=0;i<m->memory_count;++i)
        if ((strcmp(m->memory[i].name,name)==0) && (m->memory[i].index==index))
            return &m->memory[i];
    return NULL;
}

const YP_InterpreterInstance *yp_find_instance(const YP_PlatformManifest *m,
                                               const char *name)
{
    int i;
    if ((m == NULL) || (name == NULL)) return NULL;
    for (i=0;i<m->instance_count;++i)
        if (strcmp(m->instance[i].name,name)==0) return &m->instance[i];
    return NULL;
}

const YP_Interface *yp_find_interface(const YP_InterpreterInstance *instance,
                                      const char *name, int index)
{
    int i;
    if ((instance == NULL) || (name == NULL)) return NULL;
    for (i=0;i<instance->interface_count;++i)
        if ((strcmp(instance->interface[i].name,name)==0) &&
            (instance->interface[i].index==index))
            return &instance->interface[i];
    return NULL;
}

#ifdef YAML_PLATFORM_TEST
static void yp_test_string_list(const YP_StringList *v)
{
    int i;
    printf("[");
    for (i = 0; i < v->count; ++i) printf("%s%s", (i == 0) ? "" : ", ", v->value[i]);
    printf("]");
}

static void yp_test_number_list(const YP_NumberList *v)
{
    int i;
    printf("[");
    for (i = 0; i < v->count; ++i) printf("%s%g", (i == 0) ? "" : ", ", v->value[i]);
    printf("]");
}

static void yp_test_number_constraint(const char *name, const YP_NumberConstraint *n)
{
    printf("        %s.present=0x%lx type=%s default=%g values=", name, n->present, n->type, n->default_value);
    yp_test_number_list(&n->values);
    printf("\n");
}

int main(int argc, char **argv)
{
    YP_PlatformManifest m;
    const char *filename;
    int rc;
    int i;
    int j;

    filename = (argc > 1) ? argv[1] : "platform.txt";
    rc = yp_read_file(filename, &m);
    if (rc != YP_OK)
    {
        fprintf(stderr, "parse error %d, line %d: %s\n", rc, m.error_line, m.error_text);
        return 1;
    }

    printf("manifest.present=0x%lx platform=%s version=%d description=%s\n", m.present, m.platform, m.version, m.description);
    printf("file_paths=%d\n", m.file_path_count);
    for (i = 0; i < m.file_path_count; ++i)
        printf("  file_path[%d].present=0x%lx path_to=%s index=%d path=%s\n", i,
               m.file_path[i].present, m.file_path[i].path_to, m.file_path[i].index, m.file_path[i].path);

    printf("processors=%d\n", m.processor_count);
    for (i = 0; i < m.processor_count; ++i)
    {
        const YP_Processor *p = &m.processor[i];
        printf("  processor[%d].present=0x%lx archID=%s procID=%d cacheLine=%d computeServices=%d node_count=%d\n",
               i, p->present, p->archID, p->procID, p->cacheLine, p->computeServices, p->node_count);
        for (j = 0; j < p->node_count; ++j)
            printf("    node[%d].present=0x%lx path=%d index=%d name=%s\n", j,
                   p->node[j].present, p->node[j].path, p->node[j].index, p->node[j].name);
    }

    printf("memories=%d\n", m.memory_count);
    for (i = 0; i < m.memory_count; ++i)
    {
        const YP_Memory *mem = &m.memory[i];
        printf("  memory[%d].present=0x%lx name=%s index=%d size=%lu access=%d speed=%d type=%d instance=%d subblock_count=%d\n",
               i, mem->present, mem->name, mem->index, mem->size, mem->access, mem->speed,
               mem->type, mem->instance, mem->subblock_count);
        for (j = 0; j < mem->subblock_count; ++j)
            printf("    subblock[%d].present=0x%lx index=%d name=%s base=%lu size=%lu\n", j,
                   mem->subblock[j].present, mem->subblock[j].index, mem->subblock[j].name,
                   mem->subblock[j].base, mem->subblock[j].size);
    }

    printf("interpreter_instances=%d\n", m.instance_count);
    for (i = 0; i < m.instance_count; ++i)
    {
        const YP_InterpreterInstance *in = &m.instance[i];
        printf("  instance[%d].present=0x%lx name=%s index=%d archID=%s procID=%d priority=%d trace_depth=%d trace_verbosity=%d memory_isolation=%d interface_count=%d\n",
               i, in->present, in->name, in->index, in->archID, in->procID, in->priority,
               in->trace_depth, in->trace_verbosity, in->memory_isolation, in->interface_count);
        for (j = 0; j < in->interface_count; ++j)
        {
            const YP_Interface *itf = &in->interface[j];
            printf("    interface[%d].present=0x%lx path=%d index=%d c_platform_index=%d name=%s direction=%s domain=%s\n",
                   j, itf->present, itf->path, itf->index, itf->c_platform_index,
                   itf->name, itf->direction, itf->domain);
            printf("      protocol=%s malloc=%s set0copy1=%s setup_time=%g\n",
                   itf->protocol, itf->malloc_mode, itf->set0copy1, itf->setup_time);
            printf("      format.present=0x%lx interleaving=%s samprt_percent_accuracy=%g\n",
                   itf->format.present, itf->format.interleaving, itf->format.sample_rate_accuracy);
            printf("        data_type.present=0x%lx default=%s values=", itf->format.data_type.present,
                   itf->format.data_type.default_value);
            yp_test_string_list(&itf->format.data_type.values); printf("\n");
            yp_test_number_constraint("frame_length", &itf->format.frame_length);
            yp_test_number_constraint("sample_rate", &itf->format.sample_rate);
            yp_test_number_constraint("nb_channels", &itf->format.nb_channels);
        }
    }
    printf("error_line=%d error_text=%s\n", m.error_line, m.error_text);
    return 0;
}
#endif
