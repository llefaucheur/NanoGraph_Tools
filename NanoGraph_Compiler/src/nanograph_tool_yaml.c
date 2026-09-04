/*
 * yaml_graph.c
 *
 * Parser for the restricted graph description format used by the GUI.
 *
 * This is deliberately a small line-oriented parser, not a complete YAML
 * implementation. The accepted grammar is:
 *
 *   nodes:
 *     - node: <name>
 *       <property>: <value>
 *     - IO: <name>
 *       <property>: <value>
 *
 *   arcs:
 *     - OPort_<n> node: <name>
 *       IPort_<n> node: <name>
 *       <property>: <value>
 *
 * "IO:" may be used instead of "node:" at either arc endpoint.
 *
 * C90/C89 source.
 */

#undef YAML_GRAPH_TEST
#define _CRT_SECURE_NO_WARNINGS

#include "nanograph_tool_yaml.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <limits.h>

typedef enum
{
    YG_SECTION_NONE,
    YG_SECTION_NODES,
    YG_SECTION_ARCS
} YG_Section;

static const char *yg_skip_space(const char *p)
{
    while ((*p == ' ') || (*p == '\t'))
        ++p;
    return p;
}

static void yg_remove_eol(char *s)
{
    int n;

    n = (int)strlen(s);
    while (n > 0)
    {
        if ((s[n - 1] == '\n') || (s[n - 1] == '\r'))
        {
            s[n - 1] = '\0';
            --n;
        }
        else
        {
            break;
        }
    }
}

static void yg_copy_trimmed(char *dst, int dst_size, const char *src)
{
    const char *begin;
    const char *end;
    int n;

    if (dst_size <= 0)
        return;

    begin = yg_skip_space(src);
    end = begin + strlen(begin);

    while ((end > begin) &&
           ((end[-1] == ' ') || (end[-1] == '\t')))
    {
        --end;
    }

    n = (int)(end - begin);
    if (n >= dst_size)
        n = dst_size - 1;

    if (n > 0)
        memcpy(dst, begin, (size_t)n);
    dst[n] = '\0';
}

/*
 * Remove one pair of quotes only when the COMPLETE trimmed value is enclosed
 * by that pair. A value such as:
 *
 *     'yes no'  "圆周率"
 *
 * is therefore preserved as-is rather than being damaged.
 */
static void yg_copy_text_value(char *dst, int dst_size, const char *src)
{
    char temp[YG_MAX_LINE];
    int n;
    char quote;

    yg_copy_trimmed(temp, (int)sizeof(temp), src);
    n = (int)strlen(temp);

    if (n >= 2)
    {
        quote = temp[0];
        if (((quote == '\'') || (quote == '"')) &&
            (temp[n - 1] == quote))
        {
            if (n - 2 >= dst_size)
                n = dst_size + 1;

            if (dst_size > 0)
            {
                int copy_n;
                copy_n = n - 2;
                if (copy_n >= dst_size)
                    copy_n = dst_size - 1;

                if (copy_n > 0)
                    memcpy(dst, temp + 1, (size_t)copy_n);
                dst[copy_n] = '\0';
            }
            return;
        }
    }

    yg_copy_trimmed(dst, dst_size, temp);
}

static int yg_key_value(const char *line,
                        char *key,
                        int key_size,
                        const char **value)
{
    const char *p;
    const char *colon;
    int n;

    p = yg_skip_space(line);
    colon = strchr(p, ':');

    if (colon == NULL)
        return 0;

    n = (int)(colon - p);
    while ((n > 0) &&
           ((p[n - 1] == ' ') || (p[n - 1] == '\t')))
    {
        --n;
    }

    if (n >= key_size)
        n = key_size - 1;

    if (n > 0)
        memcpy(key, p, (size_t)n);
    key[n] = '\0';

    *value = yg_skip_space(colon + 1);
    return 1;
}

static int yg_parse_int(const char *text, int *value)
{
    const char *p;
    char *end;
    long v;

    p = yg_skip_space(text);
    if (*p == '\0')
        return 0;

    v = strtol(p, &end, 10);
    if (end == p)
        return 0;

    end = (char *)yg_skip_space(end);
    if (*end != '\0')
        return 0;

    if ((v > (long)INT_MAX) || (v < (long)INT_MIN))
        return 0;

    *value = (int)v;
    return 1;
}

static int yg_parse_double(const char *text, double *value)
{
    const char *p;
    char *end;
    double v;

    p = yg_skip_space(text);
    if (*p == '\0')
        return 0;

    v = strtod(p, &end);
    if (end == p)
        return 0;

    end = (char *)yg_skip_space(end);
    if (*end != '\0')
        return 0;

    *value = v;
    return 1;
}

static int yg_parse_params(const char *text,
                           double *values,
                           int max_values,
                           int *count)
{
    const char *p;
    char *end;
    int n;
    double v;

    p = text;
    n = 0;

    for (;;)
    {
        p = yg_skip_space(p);
        if (*p == '\0')
            break;

        v = strtod(p, &end);
        if (end == p)
            return 0;

        if (n >= max_values)
            return 0;

        values[n] = v;
        ++n;
        p = end;
    }

    *count = n;
    return 1;
}

int yg_split_instance_name(const char *name,
                           char *base_name,
                           int base_name_size,
                           int *instance_index)
{
    int len;
    int i;
    int digits_begin;
    long value;

    if ((name == NULL) ||
        (base_name == NULL) ||
        (base_name_size <= 0) ||
        (instance_index == NULL))
    {
        return 0;
    }

    len = (int)strlen(name);
    i = len - 1;

    while ((i >= 0) && isdigit((unsigned char)name[i]))
        --i;

    /*
     * Need at least one digit and an underscore immediately before it.
     */
    digits_begin = i + 1;
    if ((digits_begin >= len) || (i < 0) || (name[i] != '_'))
    {
        yg_copy_trimmed(base_name, base_name_size, name);
        *instance_index = -1;
        return 0;
    }

    value = strtol(name + digits_begin, NULL, 10);
    if (value > (long)INT_MAX)
    {
        yg_copy_trimmed(base_name, base_name_size, name);
        *instance_index = -1;
        return 0;
    }

    if (i >= base_name_size)
        i = base_name_size - 1;

    if (i > 0)
        memcpy(base_name, name, (size_t)i);
    base_name[i] = '\0';

    *instance_index = (int)value;
    return 1;
}

static void yg_init_node(YG_Node *node)
{
    memset(node, 0, sizeof(*node));
    node->instance_index = -1;
}

static void yg_init_endpoint(YG_Endpoint *ep)
{
    memset(ep, 0, sizeof(*ep));
    ep->port = -1;
    ep->instance_index = -1;
}

static void yg_init_arc(YG_Arc *arc)
{
    memset(arc, 0, sizeof(*arc));
    yg_init_endpoint(&arc->source);
    yg_init_endpoint(&arc->destination);
}

static void yg_set_error(YG_Graph *graph, int line_no, const char *text)
{
    graph->error_line = line_no;
    yg_copy_trimmed(graph->error_text,
                    (int)sizeof(graph->error_text),
                    text);
}

static int yg_start_node(YG_Node *node, const char *line)
{
    const char *p;

    p = yg_skip_space(line);
    if (*p != '-')
        return 0;

    ++p;
    p = yg_skip_space(p);

    yg_init_node(node);

    if (strncmp(p, "IO:", 3) == 0)
    {
        node->kind = YG_ITEM_IO;
        yg_copy_text_value(node->name, (int)sizeof(node->name), p + 3);
    }
    else if (strncmp(p, "node:", 5) == 0)
    {
        node->kind = YG_ITEM_NODE;
        yg_copy_text_value(node->name, (int)sizeof(node->name), p + 5);
    }
    else
    {
        return 0;
    }

    yg_split_instance_name(node->name,
                           node->base_name,
                           (int)sizeof(node->base_name),
                           &node->instance_index);

    return 1;
}

static int yg_parse_node_property(YG_Node *node, const char *line)
{
    char key[64];
    const char *value;

    if (!yg_key_value(line, key, (int)sizeof(key), &value))
        return 0;

    if (strcmp(key, "framel") == 0)
    {
        if (!yg_parse_int(value, &node->framel))
            return 0;
        node->present |= YG_NODE_HAS_FRAMEL;
    }
    else if (strcmp(key, "domain") == 0)
    {
        yg_copy_text_value(node->domain, (int)sizeof(node->domain), value);
        node->present |= YG_NODE_HAS_DOMAIN;
    }
    else if (strcmp(key, "nbchan") == 0)
    {
        if (!yg_parse_int(value, &node->nbchan))
            return 0;
        node->present |= YG_NODE_HAS_NBCHAN;
    }
    else if (strcmp(key, "samprt") == 0)
    {
        if (!yg_parse_double(value, &node->samprt))
            return 0;
        node->present |= YG_NODE_HAS_SAMPRT;
    }
    else if (strcmp(key, "data_type") == 0)
    {
        yg_copy_text_value(node->data_type,
                           (int)sizeof(node->data_type),
                           value);
        node->present |= YG_NODE_HAS_DATA_TYPE;
    }
    else if (strcmp(key, "preset") == 0)
    {
        if (!yg_parse_int(value, &node->preset))
            return 0;
        node->present |= YG_NODE_HAS_PRESET;
    }
    else if (strcmp(key, "params") == 0)
    {
        if (!yg_parse_params(value,
                             node->params,
                             YG_MAX_PARAMS,
                             &node->nb_params))
        {
            return 0;
        }
        node->present |= YG_NODE_HAS_PARAMS;
    }
    else if (strcmp(key, "paramtxt") == 0)
    {
        yg_copy_text_value(node->paramtxt,
                           (int)sizeof(node->paramtxt),
                           value);
        node->present |= YG_NODE_HAS_PARAMTXT;
    }
    else if (strcmp(key, "maxopp") == 0)
    {
        if (!yg_parse_int(value, &node->maxopp))
            return 0;
        node->present |= YG_NODE_HAS_MAXOPP;
    }
    else if (strcmp(key, "script") == 0)
    {
        yg_copy_text_value(node->script,
                           (int)sizeof(node->script),
                           value);
        node->present |= YG_NODE_HAS_SCRIPT;
    }
    else
    {
        /*
         * Unknown node fields are ignored intentionally, allowing the GUI
         * format to grow without immediately breaking older parsers.
         */
    }

    return 1;
}

static int yg_parse_endpoint(const char *line,
                             const char *prefix,
                             YG_Endpoint *ep)
{
    const char *p;
    const char *q;
    char *end;
    long port;

    p = yg_skip_space(line);

    if (strncmp(p, prefix, strlen(prefix)) != 0)
        return 0;

    p += strlen(prefix);

    port = strtol(p, &end, 10);
    if (end == p)
        return 0;

    if ((port < 0) || (port > (long)INT_MAX))
        return 0;

    q = yg_skip_space(end);

    if (strncmp(q, "IO:", 3) == 0)
    {
        ep->kind = YG_ITEM_IO;
        q += 3;
    }
    else if (strncmp(q, "node:", 5) == 0)
    {
        ep->kind = YG_ITEM_NODE;
        q += 5;
    }
    else
    {
        return 0;
    }

    ep->port = (int)port;
    yg_copy_text_value(ep->name, (int)sizeof(ep->name), q);

    yg_split_instance_name(ep->name,
                           ep->base_name,
                           (int)sizeof(ep->base_name),
                           &ep->instance_index);

    return 1;
}

static int yg_start_arc(YG_Arc *arc, const char *line)
{
    const char *p;

    p = yg_skip_space(line);
    if (*p != '-')
        return 0;

    ++p;
    p = yg_skip_space(p);

    yg_init_arc(arc);

    return yg_parse_endpoint(p, "OPort_", &arc->source);
}

static int yg_parse_arc_property(YG_Arc *arc, const char *line)
{
    char key[64];
    const char *value;

    if (yg_parse_endpoint(line, "IPort_", &arc->destination))
        return 1;

    if (!yg_key_value(line, key, (int)sizeof(key), &value))
        return 0;

    if (strcmp(key, "arc_name") == 0)
    {
        yg_copy_text_value(arc->arc_name,
                           (int)sizeof(arc->arc_name),
                           value);
        arc->present |= YG_ARC_HAS_NAME;
    }
    else if (strcmp(key, "buffer_size") == 0)
    {
        if (!yg_parse_int(value, &arc->buffer_size))
            return 0;
        arc->present |= YG_ARC_HAS_BUFFER_SIZE;
    }
    else if (strcmp(key, "data_type") == 0)
    {
        yg_copy_text_value(arc->data_type,
                           (int)sizeof(arc->data_type),
                           value);
        arc->present |= YG_ARC_HAS_DATA_TYPE;
    }
    else if (strcmp(key, "refresh") == 0)
    {
        yg_copy_text_value(arc->refresh,
                           (int)sizeof(arc->refresh),
                           value);
        arc->present |= YG_ARC_HAS_REFRESH;
    }
    else if (strcmp(key, "jitter_percent") == 0)
    {
        if (!yg_parse_double(value, &arc->jitter_percent))
            return 0;
        arc->present |= YG_ARC_HAS_JITTER;
    }
    else if (strcmp(key, "script") == 0)
    {
        yg_copy_text_value(arc->script,
                           (int)sizeof(arc->script),
                           value);
        arc->present |= YG_ARC_HAS_SCRIPT;
    }
    else
    {
        /* Unknown arc fields are ignored. */
    }

    return 1;
}

int yg_read_file(const char *filename, YG_Graph *graph)
{
    FILE *f;
    char line[YG_MAX_LINE];
    YG_Section section;
    YG_Node *current_node;
    YG_Arc *current_arc;
    const char *p;
    int line_no;
    int n;

    if ((filename == NULL) || (graph == NULL))
        return YG_ERR_SYNTAX;

    memset(graph, 0, sizeof(*graph));

    f = fopen(filename, "r");

    if (f == NULL)
    {
        yg_set_error(graph, 0, "cannot open input file");
        return YG_ERR_OPEN;
    }

    section = YG_SECTION_NONE;
    current_node = NULL;
    current_arc = NULL;
    line_no = 0;

    while (fgets(line, (int)sizeof(line), f) != NULL)
    {
        ++line_no;

        /*
         * Detect an overlong physical line. If fgets filled the buffer and
         * no newline was read, reject it rather than silently parsing a
         * truncated value.
         */
        n = (int)strlen(line);
        if ((n == (int)sizeof(line) - 1) &&
            (line[n - 1] != '\n') &&
            !feof(f))
        {
            yg_set_error(graph, line_no, "input line too long");
            fclose(f);
            return YG_ERR_LINE_TOO_LONG;
        }

        yg_remove_eol(line);
        p = yg_skip_space(line);

        if (*p == '\0')
            continue;

        if (*p == '#')
            continue;

        if (strcmp(p, "nodes:") == 0)
        {
            section = YG_SECTION_NODES;
            current_node = NULL;
            current_arc = NULL;
            continue;
        }

        if (strcmp(p, "arcs:") == 0)
        {
            section = YG_SECTION_ARCS;
            current_node = NULL;
            current_arc = NULL;
            continue;
        }

        if (section == YG_SECTION_NODES)
        {
            if (*p == '-')
            {
                if (graph->nb_nodes >= YG_MAX_NODES)
                {
                    yg_set_error(graph, line_no, "too many nodes");
                    fclose(f);
                    return YG_ERR_TOO_MANY_NODES;
                }

                current_node = &graph->nodes[graph->nb_nodes];

                if (!yg_start_node(current_node, p))
                {
                    yg_set_error(graph, line_no, "invalid node declaration");
                    fclose(f);
                    return YG_ERR_SYNTAX;
                }

                ++graph->nb_nodes;
            }
            else
            {
                if (current_node == NULL)
                {
                    yg_set_error(graph, line_no,
                                 "node property before node declaration");
                    fclose(f);
                    return YG_ERR_SYNTAX;
                }

                if (!yg_parse_node_property(current_node, p))
                {
                    yg_set_error(graph, line_no, "invalid node property");
                    fclose(f);
                    return YG_ERR_SYNTAX;
                }
            }
        }
        else if (section == YG_SECTION_ARCS)
        {
            if (*p == '-')
            {
                if (graph->nb_arcs >= YG_MAX_ARCS)
                {
                    yg_set_error(graph, line_no, "too many arcs");
                    fclose(f);
                    return YG_ERR_TOO_MANY_ARCS;
                }

                current_arc = &graph->arcs[graph->nb_arcs];

                if (!yg_start_arc(current_arc, p))
                {
                    yg_set_error(graph, line_no, "invalid arc declaration");
                    fclose(f);
                    return YG_ERR_SYNTAX;
                }

                ++graph->nb_arcs;
            }
            else
            {
                if (current_arc == NULL)
                {
                    yg_set_error(graph, line_no,
                                 "arc property before arc declaration");
                    fclose(f);
                    return YG_ERR_SYNTAX;
                }

                if (!yg_parse_arc_property(current_arc, p))
                {
                    yg_set_error(graph, line_no, "invalid arc property");
                    fclose(f);
                    return YG_ERR_SYNTAX;
                }
            }
        }
        else
        {
            yg_set_error(graph, line_no,
                         "content found outside nodes/arcs section");
            fclose(f);
            return YG_ERR_SYNTAX;
        }
    }

    fclose(f);

    /*
     * Every arc must have both endpoints.
     */
    n = 0;
    while (n < graph->nb_arcs)
    {
        if ((graph->arcs[n].source.port < 0) ||
            (graph->arcs[n].destination.port < 0))
        {
            yg_set_error(graph, 0, "arc has a missing endpoint");
            return YG_ERR_SYNTAX;
        }
        ++n;
    }

    return YG_OK;
}

const YG_Node *yg_find_node(const YG_Graph *graph,
                            const char *base_name,
                            int instance_index)
{
    int i;
    const YG_Node *node;

    if ((graph == NULL) || (base_name == NULL))
        return NULL;

    i = 0;
    while (i < graph->nb_nodes)
    {
        node = &graph->nodes[i];

        if ((node->instance_index == instance_index) &&
            (strcmp(node->base_name, base_name) == 0))
        {
            return node;
        }

        ++i;
    }

    return NULL;
}

const YG_Node *yg_find_full_node_name(const YG_Graph *graph,
                                      const char *name)
{
    int i;

    if ((graph == NULL) || (name == NULL))
        return NULL;

    i = 0;
    while (i < graph->nb_nodes)
    {
        if (strcmp(graph->nodes[i].name, name) == 0)
            return &graph->nodes[i];

        ++i;
    }

    return NULL;
}


/*
 * Optional demonstration program.
 *
 * Compile, for example:
 *
 *   gcc -std=c90 -pedantic -Wall -Wextra -DYAML_GRAPH_TEST \
 *       yaml_graph.c -o yaml_graph_test
 *
 * Run:
 *
 *   ./yaml_graph_test graph.yaml
 */
#ifdef YAML_GRAPH_TEST

static const char *yg_kind_name(YG_ItemKind kind)
{
    if (kind == YG_ITEM_IO)
        return "IO";
    return "node";
}

int main(int argc, char **argv)
{
    YG_Graph graph;
    const YG_Node *node;
    const YG_Arc *arc;
    int rc;
    int i;
    int j;


    rc = yg_read_file("../graph_example.yaml", &graph);
    if (rc != YG_OK)
    {
        fprintf(stderr,
                "parse error %d, line %d: %s\n",
                rc,
                graph.error_line,
                graph.error_text);
        return 1;
    }

    printf("nodes: %d\n", graph.nb_nodes);

    i = 0;
    while (i < graph.nb_nodes)
    {
        node = &graph.nodes[i];

        printf("  [%d] %s %s  base=%s instance=%d\n",
               i,
               yg_kind_name(node->kind),
               node->name,
               node->base_name,
               node->instance_index);

        if (node->present & YG_NODE_HAS_FRAMEL)
            printf("       framel=%d\n", node->framel);

        if (node->present & YG_NODE_HAS_DOMAIN)
            printf("       domain=%s\n", node->domain);

        if (node->present & YG_NODE_HAS_NBCHAN)
            printf("       nbchan=%d\n", node->nbchan);

        if (node->present & YG_NODE_HAS_SAMPRT)
            printf("       samprt=%g\n", node->samprt);

        if (node->present & YG_NODE_HAS_DATA_TYPE)
            printf("       data_type=%s\n", node->data_type);

        if (node->present & YG_NODE_HAS_PRESET)
            printf("       preset=%d\n", node->preset);

        if (node->present & YG_NODE_HAS_PARAMS)
        {
            printf("       params:");
            j = 0;
            while (j < node->nb_params)
            {
                printf(" %g", node->params[j]);
                ++j;
            }
            printf("\n");
        }

        if (node->present & YG_NODE_HAS_PARAMTXT)
            printf("       paramtxt=%s\n", node->paramtxt);

        if (node->present & YG_NODE_HAS_MAXOPP)
            printf("       maxopp=%d\n", node->maxopp);

        if (node->present & YG_NODE_HAS_SCRIPT)
            printf("       script=%s\n", node->script);

        ++i;
    }

    printf("arcs: %d\n", graph.nb_arcs);

    i = 0;
    while (i < graph.nb_arcs)
    {
        arc = &graph.arcs[i];

        printf("  [%d] OPort_%d %s %s [base=%s instance=%d]\n",
               i,
               arc->source.port,
               yg_kind_name(arc->source.kind),
               arc->source.name,
               arc->source.base_name,
               arc->source.instance_index);

        printf("      IPort_%d %s %s [base=%s instance=%d]\n",
               arc->destination.port,
               yg_kind_name(arc->destination.kind),
               arc->destination.name,
               arc->destination.base_name,
               arc->destination.instance_index);

        if (arc->present & YG_ARC_HAS_NAME)
            printf("      arc_name=%s\n", arc->arc_name);

        if (arc->present & YG_ARC_HAS_BUFFER_SIZE)
            printf("      buffer_size=%d\n", arc->buffer_size);

        if (arc->present & YG_ARC_HAS_DATA_TYPE)
            printf("      data_type=%s\n", arc->data_type);

        if (arc->present & YG_ARC_HAS_REFRESH)
            printf("      refresh=%s\n", arc->refresh);

        if (arc->present & YG_ARC_HAS_JITTER)
            printf("      jitter_percent=%g\n", arc->jitter_percent);

        if (arc->present & YG_ARC_HAS_SCRIPT)
            printf("      script=%s\n", arc->script);

        ++i;
    }

    return 0;
}

#endif
