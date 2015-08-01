#include <stdio.h>
#include <stdlib.h>
//#include <string.h>
#include <stdbool.h>
#include <time.h>
#include <math.h>
#include "zombies.h"

#include "pcg_basic.h"

/*
 * choose a random Z site (that has S neighbors)
 * choose random neighbor, if not S, skip
 * choose random number x, if x < alpha, bit, else kill
*/

pcg32_random_t rng;
char SYMBOLS[] = {' ', 'X', '.'};

int mod(int a, int b){ return a - b*((int)(a/b)) + b*(a<0); }
int xy2ind(int N, int x, int y){ return x + N*y; }
void ind2xy(int N, int ind, int *x, int *y){ *x = ind % N; *y = ind / N; }

world *create_world(int N, float alpha){
    world *w = malloc(sizeof(world));
    w->N = N;
    w->alpha = alpha;

    w->grid = malloc(sizeof(char)*N*N);
    w->bonds = malloc(sizeof(int)*N*N*4);
    w->bondgrid = malloc(sizeof(int)*N*N*4);
    w->sites = malloc(sizeof(int)*N*N*2);

    blank_world(w);
    return w;
}

void destroy_world(world *w){
    free(w->grid);
    free(w->bonds);
    free(w->bondgrid);
    free(w->sites);
    free(w);
}

void blank_world(world *w){
    w->S = w->N*w->N; w->Z = 0; w->R = 0;
    w->minx = w->miny = 1e8;
    w->maxx = w->maxy = -1e8;
    w->nbonds = 0;
    w->nsites = 0;

    for (int i=0; i<4*w->N*w->N; i++){
        w->grid[i/4] = 0;
        w->sites[i/4] = 0;
        w->bonds[i] = -1;
        w->bondgrid[i] = -1;
    }
}

void set_seed(uint64_t initstate, uint64_t initseq){
    pcg32_srandom_r(&rng, initstate, initseq);
}

void reset_inplace(world *w){
    w->S = w->N*w->N; w->Z = 0; w->R = 0;
    w->minx = w->miny = 1e8;
    w->maxx = w->maxy = -1e8;

    for (int i=0; i<w->nbonds; i++){
        w->bondgrid[w->bonds[i]] = -1;
        w->bonds[i] = -1;
    }
    w->nbonds = 0;

    for (int i=0; i<w->nsites; i++){
        w->grid[w->sites[i]] = 0;
        w->sites[i] = 0;
    }
    w->nsites = 0;
}

int inds2bond(int N, int ind0, int ind1){
    if (ind0 > ind1) iswap(ind0, ind1);

    int x0, y0, x1, y1;
    ind2xy(N, ind0, &x0, &y0);
    ind2xy(N, ind1, &x1, &y1);

    int level = -1;
    if (y0 == y1){
        if (x1-x0 == -1 || x1-x0 == N-1) level=0;
        if (x1-x0 ==  1 || x1-x0 == 1-N) level=1;
    } else {
        if (y1-y0 == -1 || y1-y0 == N-1) level=2;
        if (y1-y0 ==  1 || y1-y0 == 1-N) level=3;
    }
    if (level == -1)
        printf("Not a bond!\n");
    return ind0 + level*N*N;
}

void bond2inds(int N, int b, int *ind0, int *ind1){
    int factor = N*N;
    int level = b / factor;
    *ind0 = mod(b, factor);

    int x0, y0, x1, y1;
    ind2xy(N, *ind0, &x0, &y0);

    x1 = mod(x0 - 1*(level==0) + 1*(level==1), N);
    y1 = mod(y0 - 1*(level==2) + 1*(level==3), N);
    *ind1 = xy2ind(N, x1, y1);

    if (*ind0 > *ind1) iswap(*ind0, *ind1);
}

void add_bond(world *w, int ind0, int ind1){
    int bond = inds2bond(w->N, ind0, ind1);
    if (w->grid[ind0] == w->grid[ind1] || w->grid[ind0] == SR || w->grid[ind1] == SR){
        int bind = w->bondgrid[bond];
        if (bind >= 0)
            remove_bond(w, bind);
    } else {
        if (w->bonds[w->nbonds] < 0 && w->bondgrid[bond] < 0){
            w->bondgrid[bond] = w->nbonds;
            w->bonds[w->nbonds] = bond;
            w->nbonds += 1;
        }
    }
}

void remove_bond(world *w, int bind){
    if (bind >= w->nbonds || bind < 0) return;

    int bond = w->bonds[bind];
    if (w->bondgrid[bond] < 0) return;

    //swap with last if it isn't last
    if (bind != w->nbonds-1){
        int endb = w->bonds[w->nbonds-1];
        w->bonds[bind] = endb;
        w->bondgrid[endb] = bind;
    }

    w->bondgrid[bond] = -1;
    w->bonds[w->nbonds-1] = -1;
    w->nbonds -= 1;
}

void add_zombie(world *w, int x, int y){
    int ind0 = xy2ind(w->N, x, y);
    if (w->grid[ind0] == SZ)
        return;
    else {
        w->grid[ind0] = SZ;
        w->S -= 1;
        w->Z += 1;

        w->sites[w->nsites] = ind0;
        w->nsites += 1;
        if (w->minx > x) w->minx = x;
        if (w->miny > y) w->miny = y;
        if (w->maxx < x) w->maxx = x;
        if (w->maxy < y) w->maxy = y;
    }

    for (int i=-1; i<=1; i+=2){
        int ind1 = xy2ind(w->N, mod(x+i, w->N), y);
        add_bond(w, ind0, ind1);
    }
    for (int i=-1; i<=1; i+=2){
        int ind1 = xy2ind(w->N, x, mod(y+i, w->N));
        add_bond(w, ind0, ind1);
    }
}

void kill_site(world *w, int x, int y){
    int ind0 = xy2ind(w->N, x, y);
    if (w->grid[ind0] != SZ)
        return;
    else {
        w->grid[ind0] = SR;
        w->Z -= 1;
        w->R += 1;

        w->sites[w->nsites] = ind0;
        w->nsites += 1;
    }

    for (int i=-1; i<=1; i+=2){
        int ind1 = xy2ind(w->N, mod(x+i, w->N), y);
        remove_bond(w, w->bondgrid[inds2bond(w->N, ind0, ind1)]);
    }
    for (int i=-1; i<=1; i+=2){
        int ind1 = xy2ind(w->N, x, mod(y+i, w->N));
        remove_bond(w, w->bondgrid[inds2bond(w->N, ind0, ind1)]);
    }
}

void print_board(world *w){
    for (int j=0; j<w->N; j++){
        for (int i=0; i<w->N; i++){
            int ind = xy2ind(w->N, i, j); 
            int ind2 = xy2ind(w->N, mod(i+1, w->N), j);
            printf("%c", SYMBOLS[(int)w->grid[ind]]);

            if (w->bondgrid[inds2bond(w->N, ind, ind2)] >= 0)
                printf(" - ");
            else
                printf("   ");
        }
        printf("\n");
        for (int i=0; i<w->N; i++){
            int ind = xy2ind(w->N, i, j); 
            int ind2 = xy2ind(w->N, i, mod(j+1, w->N));

            if (w->bondgrid[inds2bond(w->N, ind, ind2)] >= 0)
                printf("|   ");
            else
                printf("    ");
        }
        printf("\n");
    }
}

void print_bonds(world *w){
    printf("Bonds: %i\n", w->nbonds);
    for (int ii=0; ii<w->nbonds; ii++){
        int b = w->bonds[ii];
        int i0, i1;
        bond2inds(w->N, b, &i0, &i1);
        printf("%i (%i %i) %i\n", b, i0, i1, w->bondgrid[b]);
    }
}

void dostep(world *w){
    int nextbind = pcg32_boundedrand_r(&rng, w->nbonds); //ran_int(0, w->nbonds);
    int nextbond = w->bonds[nextbind];
    double test = ldexp(pcg32_random_r(&rng), -32);

    int ind0, ind1;
    bond2inds(w->N, nextbond, &ind0, &ind1);

    int ind = 0;
    int tx, ty;
    if (w->grid[ind0] == w->grid[ind1]){
        remove_bond(w, nextbond);
        return;
    }

    if (test < 1.0/(1+w->alpha)){
        ind = ind0 * (w->grid[ind0] == SS) + ind1 * (w->grid[ind1] == SS);
        ind2xy(w->N, ind, &tx, &ty);
        add_zombie(w, tx, ty);
    } else {
        ind = ind0 * (w->grid[ind0] == SZ) + ind1 * (w->grid[ind1] == SZ);
        ind2xy(w->N, ind, &tx, &ty);
        kill_site(w, tx, ty);
    }
}

void save_xpm(world *w, char *filename){
    char header[] = "/* XPM */\nstatic char *mypic[] = {\n\"%i %i 3 1\",\n\". c #000000\",\n\"X c #FF0000\",\n\"  c #FFFFFF\",\n";
    char *contents = malloc(sizeof(char)*(w->N*(w->N+4) + 1280));

    int mins[] = {w->N/2-1, w->N/2-1};
    int maxs[] = {w->N/2+1, w->N/2+1};
    for (int j=0; j<w->N; j++){
        for (int i=0; i<w->N; i++){
            if (w->grid[xy2ind(w->N, i, j)] != SS){
                if (mins[0] > i) mins[0] = i;
                if (mins[1] > j) mins[1] = j;
                if (maxs[0] < i) maxs[0] = i;
                if (maxs[1] < j) maxs[1] = j;
            }
        }
    }

    printf("%i %i | %i %i\n", mins[0], maxs[0], mins[1], maxs[1]);
    int cursor = sprintf(contents, header, maxs[0]-mins[0], maxs[1]-mins[1]);
    for (int j=mins[1]; j<maxs[1]; j++){
        contents[cursor] = '\"'; 
        cursor++;

        for (int i=mins[0]; i<maxs[0]; i++){
            contents[cursor] = SYMBOLS[(int)w->grid[xy2ind(w->N, i, j)]];
            cursor++;
        }

        contents[cursor] = '\"'; cursor++;
        contents[cursor] = ','; cursor++;
        contents[cursor] = '\n'; cursor++;
    }
    contents[cursor-2] = '\n';
    contents[cursor-1] = '}';
    contents[cursor+0] = '\n';
    contents[cursor+1] = '\0';

    FILE *f = fopen(filename, "w");
    fprintf(f, "%s", contents);
    fclose(f);

    free(contents);
}

void save_binary(world *w, char *filename){
    FILE *f = fopen(filename, "w");
    fwrite(w->grid, sizeof(char), w->N*w->N, f);
    fclose(f);
}
