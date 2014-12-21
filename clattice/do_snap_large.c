#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>
#include <string.h>
#include "zombies.h"

int main(int argc, char **argv){
    double alpha = 0.69572712;
    char filename[1024];

    strncpy(filename, "/media/scratch/hi.xpm", sizeof(filename));

    int round = 0;
    if (argc >= 2)
        strncpy(filename, argv[1], sizeof(filename));
    if (argc >= 3)
        alpha = atof(argv[2]);
    
    set_seed(time(NULL) ^ (intptr_t)&printf, (intptr_t)&round);

    int NN = 8192;
    world *w = create_world(NN, alpha);

    int success = 0; 

    while (success == 0){
        reset_inplace(w);
        add_zombie(w, NN/2, NN/2);

        while (w->nbonds > 0)
            dostep(w);
        
        if (w->maxx - w->minx > NN-4 || w->maxy - w->miny > NN-4){
            printf("Saving %s -- ", filename);
            //save_xpm(w, filename);
            save_binary(w, filename);
            success = 1;
            break;
        }
    }

    return 0;
}
