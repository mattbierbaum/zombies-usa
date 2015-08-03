#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>
#include <string.h>
#include "zombies.h"

int main(int argc, char **argv){
    double alpha = 0.437345866;
    char filename[1024];
    int NN = 4096;

    strncpy(filename, "/media/scratch/hi.xpm", sizeof(filename));

    int round = 0;
    if (argc >= 2)
        strncpy(filename, argv[1], sizeof(filename));
    if (argc >= 3)
        NN = atoi(argv[2]);
    
    set_seed(time(NULL) ^ (intptr_t)&printf, (intptr_t)&round);
    world *w = create_world(2*NN, alpha);

    int success = 0; 

    while (success == 0){
        reset_inplace(w);
        add_zombie(w, NN, NN);

        while (w->nbonds > 0 &&
               ((w->maxx - w->minx) < NN-1 && (w->maxy - w->miny) < NN-1))
            dostep(w);
        
        if (w->maxx - w->minx > NN-2 || w->maxy - w->miny > NN-2){
            printf("%i %i\n", w->maxx-w->minx, w->maxy-w->miny);
            save_binary(w, filename);
            success = 1;
            break;
        }
    }

    destroy_world(w);
    return 0;
}
