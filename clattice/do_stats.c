#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>
#include <math.h>
#include "zombies.h"

int main(int argc, char **argv){
    double alpha = 0.69573;

    int round = 0;

    if (argc == 3){
        alpha = atof(argv[1]);
        round = atoi(argv[2]);
    }
    set_seed(time(NULL) ^ (intptr_t)&printf, (intptr_t)&round);

    int NN = 16384;
    world *w = create_world(NN, alpha);

    for (int sample=0; sample<1e6; sample++){
        reset_inplace(w);
        add_zombie(w, NN/2, NN/2);

        while (w->nbonds > 0){
            if ((w->Z+w->R) > NN*NN/128) break;
            dostep(w);
        }

        printf("%f %i %i %i %i\n", alpha, w->S, w->Z, w->R, (w->S+w->Z+w->R));
    }

    save_xpm(w, "/media/scratch/hi.xpm");
    return 0;
}
