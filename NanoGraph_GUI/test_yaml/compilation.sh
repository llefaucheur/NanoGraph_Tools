gcc -std=c90 -pedantic -Wall -Wextra -Werror \
    -DYAML_GRAPH_TEST graph_yaml_reader/yaml_graph.c -o graph_test.exe

gcc -std=c90 -pedantic -Wall -Wextra -Werror \
    -DYAML_NODE_TEST node_yaml_reader/yaml_node.c -o node_test.exe

gcc -std=c90 -pedantic -Wall -Wextra -Werror \
    -DYAML_PLATFORM_TEST platform_yaml_reader/yaml_platform.c -o platform_test.exe
    
    
./graph_test.exe graph.txt
./node_test.exe node.txt
./platform_test.exe platform.txt
