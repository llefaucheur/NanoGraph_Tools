#include "yaml_node.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <errno.h>

static void yn_copy(char *dst, int size, const char *src)
{
    int n;
    if (size <= 0) return;
    if (src == NULL) src = "";
    n = (int)strlen(src);
    if (n >= size) n = size - 1;
    memcpy(dst, src, (size_t)n);
    dst[n] = '\0';
}

static char *yn_ltrim(char *s)
{
    while ((*s == ' ') || (*s == '\t')) ++s;
    return s;
}

static void yn_rtrim(char *s)
{
    int n;
    n = (int)strlen(s);
    while ((n > 0) && ((s[n-1] == ' ') || (s[n-1] == '\t') ||
                       (s[n-1] == '\r') || (s[n-1] == '\n')))
    {
        s[--n] = '\0';
    }
}

static void yn_strip_comment(char *s)
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
    yn_rtrim(s);
}

static int yn_indent(const char *s)
{
    int n;
    n = 0;
    while (*s == ' ')
    {
        ++n;
        ++s;
    }
    return n;
}

static int yn_key_value(char *text, char **key, char **value)
{
    char *p;
    p = strchr(text, ':');
    if (p == NULL) return 0;
    *p = '\0';
    yn_rtrim(text);
    *key = yn_ltrim(text);
    *value = yn_ltrim(p + 1);
    yn_rtrim(*value);
    return 1;
}

static void yn_unquote(char *s)
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

static int yn_int(const char *s, int *v)
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

static int yn_double(const char *s, double *v)
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

static int yn_string_list(const char *src, YN_StringList *list)
{
    char tmp[YN_MAX_LINE];
    char *p;
    char *q;
    char item[YN_MAX_VALUE];
    int n;
    list->count = 0;
    yn_copy(tmp, (int)sizeof(tmp), src);
    p = yn_ltrim(tmp);
    n = (int)strlen(p);
    if ((n < 2) || (p[0] != '[') || (p[n-1] != ']')) return 0;
    p[n-1] = '\0';
    ++p;
    while (*p != '\0')
    {
        p = yn_ltrim(p);
        q = strchr(p, ',');
        if (q != NULL) *q = '\0';
        yn_rtrim(p);
        yn_copy(item, (int)sizeof(item), p);
        yn_unquote(item);
        if (item[0] != '\0')
        {
            if (list->count >= YN_MAX_VALUES) return 0;
            yn_copy(list->value[list->count], YN_MAX_VALUE, item);
            ++list->count;
        }
        if (q == NULL) break;
        p = q + 1;
    }
    return 1;
}

static int yn_number_list(const char *src, YN_NumberList *list)
{
    YN_StringList sl;
    int i;
    if (!yn_string_list(src, &sl)) return 0;
    list->count = 0;
    for (i = 0; i < sl.count; ++i)
    {
        if (!yn_double(sl.value[i], &list->value[i])) return 0;
        ++list->count;
    }
    return 1;
}

static void yn_error(YN_NodeManifest *m, int line, const char *text)
{
    m->error_line = line;
    yn_copy(m->error_text, (int)sizeof(m->error_text), text);
}

static int yn_set_port(YN_Port *p, const char *key, char *value)
{
    if (strcmp(key, "name") == 0) yn_copy(p->name, YN_MAX_NAME, value);
    else if (strcmp(key, "index") == 0)
    {
        if (!yn_int(value, &p->index)) return 0;
        p->present |= YN_PORT_HAS_INDEX;
    }
    else if (strcmp(key, "format") == 0)
    {
        yn_copy(p->format, YN_MAX_NAME, value);
        p->present |= YN_PORT_HAS_FORMAT;
    }
    else if (strcmp(key, "domain") == 0)
    {
        yn_copy(p->domain, YN_MAX_VALUE, value);
        p->present |= YN_PORT_HAS_DOMAIN;
    }
    else if (strcmp(key, "buffer_overlay") == 0)
    {
        if (!yn_int(value, &p->buffer_overlay)) return 0;
        p->present |= YN_PORT_HAS_OVERLAY;
    }
    return 1;
}

static int yn_set_format(YN_Format *f, const char *key, char *value)
{
    if (strcmp(key, "format") == 0) yn_copy(f->name, YN_MAX_NAME, value);
    else if (strcmp(key, "interleaving") == 0)
    { yn_copy(f->interleaving, YN_MAX_VALUE, value); f->present |= YN_FMT_HAS_INTERLEAVING; }
    else if (strcmp(key, "data_type") == 0)
    { yn_copy(f->data_type, YN_MAX_VALUE, value); f->present |= YN_FMT_HAS_DATA_TYPE; }
    else if (strcmp(key, "data_type_default") == 0)
    { yn_copy(f->data_type_default, YN_MAX_VALUE, value); f->present |= YN_FMT_HAS_DATA_TYPE_DEFAULT; }
    else if (strcmp(key, "data_type_values") == 0)
    { if (!yn_string_list(value, &f->data_type_values)) return 0; f->present |= YN_FMT_HAS_DATA_TYPE_VALUES; }
    else if (strcmp(key, "frame_length_default") == 0)
    { if (!yn_int(value, &f->frame_length_default)) return 0; f->present |= YN_FMT_HAS_FRAME_DEFAULT; }
    else if (strcmp(key, "frame_length_values") == 0)
    { if (!yn_number_list(value, &f->frame_length_values)) return 0; f->present |= YN_FMT_HAS_FRAME_VALUES; }
    else if (strcmp(key, "sample_rate_type") == 0)
    { yn_copy(f->sample_rate_type, YN_MAX_VALUE, value); f->present |= YN_FMT_HAS_RATE_TYPE; }
    else if (strcmp(key, "sample_rate_default") == 0)
    { if (!yn_double(value, &f->sample_rate_default)) return 0; f->present |= YN_FMT_HAS_RATE_DEFAULT; }
    else if (strcmp(key, "sample_rate_values") == 0)
    { if (!yn_number_list(value, &f->sample_rate_values)) return 0; f->present |= YN_FMT_HAS_RATE_VALUES; }
    else if (strcmp(key, "sample_rate_accuracy") == 0)
    { if (!yn_double(value, &f->sample_rate_accuracy)) return 0; f->present |= YN_FMT_HAS_RATE_ACCURACY; }
    else if (strcmp(key, "nb_channels_default") == 0)
    { if (!yn_int(value, &f->nb_channels_default)) return 0; f->present |= YN_FMT_HAS_CHANNEL_DEFAULT; }
    else if (strcmp(key, "nb_channels_values") == 0)
    { if (!yn_number_list(value, &f->nb_channels_values)) return 0; f->present |= YN_FMT_HAS_CHANNEL_VALUES; }
    else if (strcmp(key, "nb_channels_min") == 0)
    { if (!yn_int(value, &f->nb_channels_min)) return 0; f->present |= YN_FMT_HAS_CHANNEL_MIN; }
    else if (strcmp(key, "nb_channels_max") == 0)
    { if (!yn_int(value, &f->nb_channels_max)) return 0; f->present |= YN_FMT_HAS_CHANNEL_MAX; }
    else if (strcmp(key, "consume_min") == 0)
    { if (!yn_int(value, &f->consume_min)) return 0; f->present |= YN_FMT_HAS_CONSUME_MIN; }
    else if (strcmp(key, "consume_max") == 0)
    { if (!yn_int(value, &f->consume_max)) return 0; f->present |= YN_FMT_HAS_CONSUME_MAX; }
    else if (strcmp(key, "produce_min") == 0)
    { if (!yn_int(value, &f->produce_min)) return 0; f->present |= YN_FMT_HAS_PRODUCE_MIN; }
    else if (strcmp(key, "produce_max") == 0)
    { if (!yn_int(value, &f->produce_max)) return 0; f->present |= YN_FMT_HAS_PRODUCE_MAX; }
    else if (strcmp(key, "unit") == 0)
    { yn_copy(f->unit, YN_MAX_VALUE, value); f->present |= YN_FMT_HAS_UNIT; }
    else if (strcmp(key, "unit_scale") == 0)
    { if (!yn_double(value, &f->unit_scale)) return 0; f->present |= YN_FMT_HAS_UNIT_SCALE; }
    return 1;
}

static int yn_set_parameter(YN_Parameter *p, const char *key, char *value)
{
    if (strcmp(key, "name") == 0) yn_copy(p->name, YN_MAX_NAME, value);
    else if (strcmp(key, "type") == 0)
    { yn_copy(p->type, YN_MAX_VALUE, value); p->present |= YN_PARAM_HAS_TYPE; }
    else if (strcmp(key, "default") == 0)
    { yn_copy(p->default_value, YN_MAX_VALUE, value); p->present |= YN_PARAM_HAS_DEFAULT; }
    else if (strcmp(key, "values") == 0)
    { if (!yn_string_list(value, &p->values)) return 0; p->present |= YN_PARAM_HAS_VALUES; }
    else if (strcmp(key, "min") == 0)
    { if (!yn_double(value, &p->min_value)) return 0; p->present |= YN_PARAM_HAS_MIN; }
    else if (strcmp(key, "max") == 0)
    { if (!yn_double(value, &p->max_value)) return 0; p->present |= YN_PARAM_HAS_MAX; }
    else if (strcmp(key, "unit") == 0)
    { yn_copy(p->unit, YN_MAX_VALUE, value); p->present |= YN_PARAM_HAS_UNIT; }
    else if (strcmp(key, "help") == 0)
    { yn_copy(p->help, YN_MAX_TEXT, value); p->present |= YN_PARAM_HAS_HELP; }
    return 1;
}

static int yn_set_impl(YN_Implementation *p, const char *key, char *value)
{
    if (strcmp(key, "language") == 0)
    { yn_copy(p->language, YN_MAX_VALUE, value); p->present |= YN_IMPL_HAS_LANGUAGE; }
    else if (strcmp(key, "complexity") == 0)
    { if (!yn_double(value, &p->complexity)) return 0; p->present |= YN_IMPL_HAS_COMPLEXITY; }
    else if (strcmp(key, "header") == 0)
    { yn_copy(p->header, YN_MAX_PATH, value); p->present |= YN_IMPL_HAS_HEADER; }
    else if (strcmp(key, "init") == 0)
    { yn_copy(p->init, YN_MAX_NAME, value); p->present |= YN_IMPL_HAS_INIT; }
    else if (strcmp(key, "process") == 0)
    { yn_copy(p->process, YN_MAX_NAME, value); p->present |= YN_IMPL_HAS_PROCESS; }
    else if (strcmp(key, "processor_architecture") == 0)
    { yn_copy(p->processor_architecture, YN_MAX_ARCH, value); p->present |= YN_IMPL_HAS_ARCH; }
    else if (strcmp(key, "processor_fpu_option") == 0)
    { yn_copy(p->processor_fpu_option, YN_MAX_VALUE, value); p->present |= YN_IMPL_HAS_FPU; }
    else if (strcmp(key, "malloc") == 0)
    { yn_copy(p->malloc_mode, YN_MAX_VALUE, value); p->present |= YN_IMPL_HAS_MALLOC; }
    else if (strcmp(key, "reentrant") == 0)
    { yn_copy(p->reentrant, YN_MAX_VALUE, value); p->present |= YN_IMPL_HAS_REENTRANT; }
    else if (strcmp(key, "compatibility") == 0)
    { if (!yn_int(value, &p->compatibility)) return 0; p->present |= YN_IMPL_HAS_COMPATIBILITY; }
    else if (strcmp(key, "nb_memory_banks") == 0)
    { if (!yn_int(value, &p->nb_memory_banks)) return 0; p->present |= YN_IMPL_HAS_NB_BANKS; }
    else if (strcmp(key, "library") == 0)
    { if (!yn_int(value, &p->library)) return 0; p->present |= YN_IMPL_HAS_LIBRARY; }
    return 1;
}

static int yn_set_memory(YN_MemoryBank *m, const char *key, char *value)
{
#define YN_MI(k,field,flag) if (strcmp(key,k)==0) { if(!yn_int(value,&m->field)) return 0; m->present|=flag; return 1; }
    YN_MI("index", index, YN_MEM_HAS_INDEX)
    YN_MI("relocatable", relocatable, YN_MEM_HAS_RELOCATABLE)
    YN_MI("memory_clear", memory_clear, YN_MEM_HAS_CLEAR)
    YN_MI("data0prog1", data0prog1, YN_MEM_HAS_DATA0PROG1)
    YN_MI("mem_alloc", mem_alloc, YN_MEM_HAS_ALLOC)
    YN_MI("mem_alloc_a", mem_alloc_a, YN_MEM_HAS_ALLOC_A)
    YN_MI("mem_alloc_b", mem_alloc_b, YN_MEM_HAS_ALLOC_B)
    YN_MI("mem_alloc_b_type", mem_alloc_b_type, YN_MEM_HAS_ALLOC_B_TYPE)
    YN_MI("mem_alloc_b_arc", mem_alloc_b_arc, YN_MEM_HAS_ALLOC_B_ARC)
    YN_MI("mem_alloc_c", mem_alloc_c, YN_MEM_HAS_ALLOC_C)
    YN_MI("mem_alloc_c_arc", mem_alloc_c_arc, YN_MEM_HAS_ALLOC_C_ARC)
    YN_MI("mem_alloc_d", mem_alloc_d, YN_MEM_HAS_ALLOC_D)
    YN_MI("mem_alloc_d_arc", mem_alloc_d_arc, YN_MEM_HAS_ALLOC_D_ARC)
#undef YN_MI
    if (strcmp(key, "mem_type") == 0)
    { yn_copy(m->mem_type, YN_MAX_VALUE, value); m->present |= YN_MEM_HAS_TYPE; }
    else if (strcmp(key, "mem_speed") == 0)
    { yn_copy(m->mem_speed, YN_MAX_VALUE, value); m->present |= YN_MEM_HAS_SPEED; }
    else if (strcmp(key, "format") == 0)
    { yn_copy(m->format, YN_MAX_NAME, value); m->present |= YN_MEM_HAS_FORMAT; }
    return 1;
}

int yn_read_file(const char *filename, YN_NodeManifest *m)
{
    FILE *fp;
    char line[YN_MAX_LINE];
    char work[YN_MAX_LINE];
    char *text;
    char *key;
    char *value;
    int line_no;
    int ind;
    int section;
    int port_kind;
    int current_port;
    int current_format;
    int current_param;
    int current_mem;
    int interface_kind;
    int interface_format;
    int format_constraint;
    char impl_list[YN_MAX_NAME];

    enum { S_TOP=0, S_PORTS, S_FORMATS, S_PARAMETERS, S_ACTIVATION, S_IMPLEMENTATION, S_INTERFACES };
    enum { C_NONE=0, C_DATA_TYPE, C_FRAME_LENGTH, C_SAMPLE_RATE, C_NB_CHANNELS };

    if ((filename == NULL) || (m == NULL)) return YN_ERR_SYNTAX;
    memset(m, 0, sizeof(*m));
    current_port = current_format = current_param = current_mem = -1;
    port_kind = 0;
    interface_kind = 0;
    interface_format = -1;
    format_constraint = C_NONE;
    impl_list[0] = '\0';
    section = S_TOP;

    fp = fopen(filename, "r");
    if (fp == NULL) return YN_ERR_OPEN;

    line_no = 0;
    while (fgets(line, (int)sizeof(line), fp) != NULL)
    {
        ++line_no;
        if ((strchr(line, '\n') == NULL) && !feof(fp))
        { fclose(fp); yn_error(m,line_no,"line too long"); return YN_ERR_LINE_TOO_LONG; }

        yn_copy(work, (int)sizeof(work), line);
        yn_strip_comment(work);
        if (yn_ltrim(work)[0] == '\0') continue;
        ind = yn_indent(work);
        text = yn_ltrim(work);

        if (ind == 0)
        {
            section = S_TOP;
            current_port = current_format = current_param = current_mem = -1;
            port_kind = 0;
            interface_kind = 0;
            interface_format = -1;
            format_constraint = C_NONE;
            impl_list[0] = '\0';
            if (!yn_key_value(text, &key, &value))
            { fclose(fp); yn_error(m,line_no,"expected top-level key"); return YN_ERR_SYNTAX; }
            yn_unquote(value);
            if (strcmp(key,"node") == 0) yn_copy(m->node, YN_MAX_NAME, value);
            else if (strcmp(key,"node_designer") == 0)
            { yn_copy(m->node_designer, YN_MAX_NAME, value); m->present |= YN_NODE_HAS_DESIGNER; }
            else if (strcmp(key,"version") == 0)
            { if(!yn_int(value,&m->version)) goto badnum; m->present |= YN_NODE_HAS_VERSION; }
            else if (strcmp(key,"description") == 0)
            { yn_copy(m->description, YN_MAX_TEXT, value); m->present |= YN_NODE_HAS_DESCRIPTION; }
            else if (strcmp(key,"interfaces") == 0) section = S_INTERFACES;
            else if (strcmp(key,"ports") == 0) section = S_PORTS;
            else if (strcmp(key,"formats") == 0) section = S_FORMATS;
            else if (strcmp(key,"parameters") == 0) section = S_PARAMETERS;
            else if (strcmp(key,"activation") == 0) section = S_ACTIVATION;
            else if (strcmp(key,"implementation") == 0) section = S_IMPLEMENTATION;
            continue;
        }

        if (section == S_INTERFACES)
        {
            YN_Port *port;
            YN_Format *fmt;
            port = NULL;
            fmt = NULL;

            if ((ind == 2) && (text[0] == '-'))
            {
                text = yn_ltrim(text + 1);
                if (!yn_key_value(text, &key, &value)) goto syntax;
                if ((strcmp(key, "rx_interface") != 0) && (strcmp(key, "tx_interface") != 0)) goto syntax;
                interface_kind = (strcmp(key, "rx_interface") == 0) ? 1 : 2;
                if (interface_kind == 1)
                {
                    if (m->input_count >= YN_MAX_PORTS) goto toomany;
                    current_port = m->input_count++;
                    memset(&m->input[current_port], 0, sizeof(YN_Port));
                    port = &m->input[current_port];
                }
                else
                {
                    if (m->output_count >= YN_MAX_PORTS) goto toomany;
                    current_port = m->output_count++;
                    memset(&m->output[current_port], 0, sizeof(YN_Port));
                    port = &m->output[current_port];
                }
                if (m->format_count >= YN_MAX_FORMATS) goto toomany;
                interface_format = m->format_count++;
                memset(&m->format[interface_format], 0, sizeof(YN_Format));
                format_constraint = C_NONE;
            }
            else if ((current_port >= 0) && (interface_kind != 0))
            {
                port = (interface_kind == 1) ? &m->input[current_port] : &m->output[current_port];
                if (interface_format >= 0) fmt = &m->format[interface_format];

                if ((ind == 4) && yn_key_value(text, &key, &value))
                {
                    yn_unquote(value);
                    format_constraint = C_NONE;
                    if (strcmp(key, "format") == 0)
                    {
                        if (fmt != NULL)
                        {
                            if (port->name[0] != '\0') yn_copy(fmt->name, YN_MAX_NAME, port->name);
                            else sprintf(fmt->name, "interface%d", interface_format);
                            yn_copy(port->format, YN_MAX_NAME, fmt->name);
                            port->present |= YN_PORT_HAS_FORMAT;
                        }
                    }
                    else
                    {
                        if (!yn_set_port(port, key, value)) goto badnum;
                        if ((strcmp(key, "name") == 0) && (fmt != NULL))
                        {
                            yn_copy(fmt->name, YN_MAX_NAME, value);
                            yn_copy(port->format, YN_MAX_NAME, value);
                            port->present |= YN_PORT_HAS_FORMAT;
                        }
                    }
                }
                else if ((ind == 6) && (fmt != NULL) && yn_key_value(text, &key, &value))
                {
                    yn_unquote(value);
                    if ((strcmp(key, "data_type") == 0) && (*value == '\0')) format_constraint = C_DATA_TYPE;
                    else if ((strcmp(key, "frame_length") == 0) && (*value == '\0')) format_constraint = C_FRAME_LENGTH;
                    else if ((strcmp(key, "sample_rate") == 0) && (*value == '\0')) format_constraint = C_SAMPLE_RATE;
                    else if ((strcmp(key, "nb_channels") == 0) && (*value == '\0')) format_constraint = C_NB_CHANNELS;
                    else
                    {
                        format_constraint = C_NONE;
                        if (!yn_set_format(fmt, key, value)) goto badnum;
                    }
                }
                else if ((ind >= 8) && (fmt != NULL) && yn_key_value(text, &key, &value))
                {
                    char mapped[64];
                    mapped[0] = '\0';
                    yn_unquote(value);
                    if (format_constraint == C_DATA_TYPE)
                    {
                        if (strcmp(key,"default") == 0) yn_copy(mapped,(int)sizeof(mapped),"data_type_default");
                        else if (strcmp(key,"values") == 0) yn_copy(mapped,(int)sizeof(mapped),"data_type_values");
                    }
                    else if (format_constraint == C_FRAME_LENGTH)
                    {
                        if (strcmp(key,"default") == 0) yn_copy(mapped,(int)sizeof(mapped),"frame_length_default");
                        else if (strcmp(key,"values") == 0) yn_copy(mapped,(int)sizeof(mapped),"frame_length_values");
                    }
                    else if (format_constraint == C_SAMPLE_RATE)
                    {
                        if (strcmp(key,"type") == 0) yn_copy(mapped,(int)sizeof(mapped),"sample_rate_type");
                        else if (strcmp(key,"default") == 0) yn_copy(mapped,(int)sizeof(mapped),"sample_rate_default");
                        else if (strcmp(key,"values") == 0) yn_copy(mapped,(int)sizeof(mapped),"sample_rate_values");
                        else if (strcmp(key,"accuracy") == 0) yn_copy(mapped,(int)sizeof(mapped),"sample_rate_accuracy");
                    }
                    else if (format_constraint == C_NB_CHANNELS)
                    {
                        if (strcmp(key,"default") == 0) yn_copy(mapped,(int)sizeof(mapped),"nb_channels_default");
                        else if (strcmp(key,"values") == 0) yn_copy(mapped,(int)sizeof(mapped),"nb_channels_values");
                        else if (strcmp(key,"min") == 0) yn_copy(mapped,(int)sizeof(mapped),"nb_channels_min");
                        else if (strcmp(key,"max") == 0) yn_copy(mapped,(int)sizeof(mapped),"nb_channels_max");
                    }
                    if ((mapped[0] != '\0') && !yn_set_format(fmt, mapped, value)) goto badnum;
                }
            }
        }
        else if (section == S_PORTS)
        {
            if ((ind == 2) && yn_key_value(text,&key,&value))
            {
                if (strcmp(key,"nb_input") == 0)
                { if(!yn_int(value,&m->nb_input)) goto badnum; m->present |= YN_NODE_HAS_NB_INPUT; }
                else if (strcmp(key,"nb_output") == 0)
                { if(!yn_int(value,&m->nb_output)) goto badnum; m->present |= YN_NODE_HAS_NB_OUTPUT; }
                else if (strcmp(key,"inputs") == 0) { port_kind=1; current_port=-1; }
                else if (strcmp(key,"outputs") == 0) { port_kind=2; current_port=-1; }
            }
            else if ((ind == 4) && (text[0] == '-'))
            {
                text = yn_ltrim(text+1);
                if (port_kind == 1)
                {
                    if (m->input_count >= YN_MAX_PORTS) goto toomany;
                    current_port = m->input_count++;
                    memset(&m->input[current_port],0,sizeof(YN_Port));
                }
                else if (port_kind == 2)
                {
                    if (m->output_count >= YN_MAX_PORTS) goto toomany;
                    current_port = m->output_count++;
                    memset(&m->output[current_port],0,sizeof(YN_Port));
                }
                if ((current_port >= 0) && (*text != '\0') && yn_key_value(text,&key,&value))
                {
                    yn_unquote(value);
                    if (!yn_set_port(port_kind==1?&m->input[current_port]:&m->output[current_port],key,value)) goto badnum;
                }
            }
            else if ((ind >= 6) && (current_port >= 0) && yn_key_value(text,&key,&value))
            {
                yn_unquote(value);
                if (!yn_set_port(port_kind==1?&m->input[current_port]:&m->output[current_port],key,value)) goto badnum;
            }
        }
        else if (section == S_FORMATS)
        {
            if ((ind == 2) && (text[0] == '-'))
            {
                if (m->format_count >= YN_MAX_FORMATS) goto toomany;
                current_format = m->format_count++;
                memset(&m->format[current_format],0,sizeof(YN_Format));
                text=yn_ltrim(text+1);
                if ((*text!='\0') && yn_key_value(text,&key,&value))
                { yn_unquote(value); if(!yn_set_format(&m->format[current_format],key,value)) goto badnum; }
            }
            else if ((ind >= 4) && (current_format >= 0) && yn_key_value(text,&key,&value))
            { yn_unquote(value); if(!yn_set_format(&m->format[current_format],key,value)) goto badnum; }
        }
        else if (section == S_PARAMETERS)
        {
            if ((ind == 2) && (text[0] == '-'))
            {
                if (m->parameter_count >= YN_MAX_PARAMETERS) goto toomany;
                current_param=m->parameter_count++;
                memset(&m->parameter[current_param],0,sizeof(YN_Parameter));
                text=yn_ltrim(text+1);
                if ((*text!='\0') && yn_key_value(text,&key,&value))
                { yn_unquote(value); if(!yn_set_parameter(&m->parameter[current_param],key,value)) goto badnum; }
            }
            else if ((ind >= 4) && (current_param >= 0) && yn_key_value(text,&key,&value))
            { yn_unquote(value); if(!yn_set_parameter(&m->parameter[current_param],key,value)) goto badnum; }
        }
        else if (section == S_ACTIVATION)
        {
            if ((ind >= 2) && yn_key_value(text,&key,&value) && (strcmp(key,"key") == 0))
            { yn_unquote(value); yn_copy(m->activation_key,YN_MAX_VALUE,value); m->present |= YN_NODE_HAS_ACTIVATION; }
        }
        else if (section == S_IMPLEMENTATION)
        {
            if ((ind == 2) && yn_key_value(text,&key,&value))
            {
                yn_unquote(value);
                if (*value == '\0')
                { yn_copy(impl_list, YN_MAX_NAME, key); current_mem=-1; }
                else
                { impl_list[0]='\0'; if(!yn_set_impl(&m->implementation,key,value)) goto badnum; }
            }
            else if ((ind == 4) && (text[0] == '-') && (impl_list[0] != '\0'))
            {
                if (m->implementation.memory_bank_count >= YN_MAX_MEMORY_BANKS) goto toomany;
                current_mem=m->implementation.memory_bank_count++;
                memset(&m->implementation.memory_bank[current_mem],0,sizeof(YN_MemoryBank));
                yn_copy(m->implementation.memory_bank[current_mem].section,YN_MAX_NAME,impl_list);
                text=yn_ltrim(text+1);
                if ((*text!='\0') && yn_key_value(text,&key,&value))
                { yn_unquote(value); if(!yn_set_memory(&m->implementation.memory_bank[current_mem],key,value)) goto badnum; }
            }
            else if ((ind >= 6) && (current_mem >= 0) && yn_key_value(text,&key,&value))
            { yn_unquote(value); if(!yn_set_memory(&m->implementation.memory_bank[current_mem],key,value)) goto badnum; }
        }
    }

    fclose(fp);
    if (m->node[0] == '\0')
    { yn_error(m,0,"missing node name"); return YN_ERR_SYNTAX; }
    if (!(m->present & YN_NODE_HAS_NB_INPUT)) m->nb_input=m->input_count;
    if (!(m->present & YN_NODE_HAS_NB_OUTPUT)) m->nb_output=m->output_count;
    return YN_OK;

syntax:
    fclose(fp); yn_error(m,line_no,"invalid interface syntax"); return YN_ERR_SYNTAX;

badnum:
    fclose(fp); yn_error(m,line_no,"invalid numeric/list value"); return YN_ERR_BAD_NUMBER;
toomany:
    fclose(fp); yn_error(m,line_no,"too many manifest items"); return YN_ERR_TOO_MANY;
}

const YN_Format *yn_find_format(const YN_NodeManifest *m, const char *name)
{
    int i;
    if ((m == NULL) || (name == NULL)) return NULL;
    for (i=0;i<m->format_count;++i) if(strcmp(m->format[i].name,name)==0) return &m->format[i];
    return NULL;
}

const YN_Parameter *yn_find_parameter(const YN_NodeManifest *m, const char *name)
{
    int i;
    if ((m == NULL) || (name == NULL)) return NULL;
    for (i=0;i<m->parameter_count;++i) if(strcmp(m->parameter[i].name,name)==0) return &m->parameter[i];
    return NULL;
}

#ifdef YAML_NODE_TEST
int main(int argc, char **argv)
{
    YN_NodeManifest m;
    const char *filename;
    int rc;
    int i;

    filename = (argc > 1) ? argv[1] : "node.yaml";
    rc = yn_read_file(filename, &m);
    if (rc != YN_OK)
    {
        fprintf(stderr, "parse error %d, line %d: %s\n",
                rc, m.error_line, m.error_text);
        return 1;
    }

    printf("node: %s version=%d designer=%s\n", m.node, m.version, m.node_designer);
    printf("ports: input=%d output=%d\n", m.input_count, m.output_count);
    i = 0;
    while (i < m.input_count)
    {
        printf("  input[%d] name=%s index=%d format=%s overlay=%d\n",
               i, m.input[i].name, m.input[i].index,
               m.input[i].format, m.input[i].buffer_overlay);
        ++i;
    }
    i = 0;
    while (i < m.output_count)
    {
        printf("  output[%d] name=%s index=%d format=%s overlay=%d\n",
               i, m.output[i].name, m.output[i].index,
               m.output[i].format, m.output[i].buffer_overlay);
        ++i;
    }
    printf("formats: %d\n", m.format_count);
    i = 0;
    while (i < m.format_count)
    {
        printf("  [%d] %s present=0x%lx\n", i, m.format[i].name, m.format[i].present);
        ++i;
    }
    printf("parameters: %d\n", m.parameter_count);
    i = 0;
    while (i < m.parameter_count)
    {
        printf("  [%d] %s type=%s default=%s\n", i,
               m.parameter[i].name, m.parameter[i].type,
               m.parameter[i].default_value);
        ++i;
    }
    printf("implementation: language=%s arch=%s memory_banks=%d\n",
           m.implementation.language, m.implementation.processor_architecture,
           m.implementation.memory_bank_count);
    return 0;
}
#endif
