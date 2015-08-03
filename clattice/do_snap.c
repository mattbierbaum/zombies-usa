#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>
#include <string.h>
#include "zombies.h"

int main(int argc, char **argv){
    double alpha = 0.437345866;
    char filename[1024];

    strncpy(filename, "/media/scratch/hi.xpm", sizeof(filename));

    int round = 0;
    if (argc >= 2)
        alpha = atof(argv[1]);
    if (argc >= 3)
        strncpy(filename, argv[2], sizeof(filename));
    if (argc >= 4)
        round = atoi(argv[3]);
    
    set_seed(time(NULL) ^ (intptr_t)&printf, (intptr_t)&round);

    int NN = 8192/1;
    world *w = create_world(NN, alpha);

    add_zombie(w, NN/2, NN/2);
    while (w->nbonds > 0)
        dostep(w);
    save_xpm(w, filename);

    destroy_world(w);
    return 0;
}
