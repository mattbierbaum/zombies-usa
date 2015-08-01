#ifndef __ZOMBIES_H__
#define __ZOMBIES_H__

#include "pcg_basic.h"

/*
 * choose a random Z site (that has S neighbors)
 * choose random neighbor, if not S, skip
 * choose random number x, if x < alpha, bit, else kill
*/

#define SS 0
#define SZ 1
#define SR 2
#define iswap(x, y) do { int _tempv_ = x; x = y; y = _tempv_; } while (0);

typedef struct {
    int N;
    int S, Z, R;
    int minx, miny, maxx, maxy;
    float alpha;
    char *grid;

    // continuous list of active bonds (their locations)
    int nbonds;
    int *bonds;

    // true / false whether a bond exists
    int *bondgrid;

    // sites that have been filled (only needed for reset_inplace speed)
    int nsites;
    int *sites;
} world;

int mod(int a, int b);
int xy2ind(int N, int x, int y);
void ind2xy(int N, int ind, int *x, int *y);

world *create_world(int N, float alpha);
void destroy_world(world *w);
void blank_world(world *w);
void reset_inplace(world *w);
void set_seed(uint64_t initstate, uint64_t initseq);

int inds2bond(int N, int ind0, int ind1);
void bond2inds(int N, int b, int *ind0, int *ind1);

void add_bond(world *w, int ind0, int ind1);
void remove_bond(world *w, int bind);

void add_zombie(world *w, int x, int y);
void kill_site(world *w, int x, int y);

void print_board(world *w);
void print_bonds(world *w);
void dostep(world *w);
void save_xpm(world *w, char *filename);
void save_binary(world *w, char *filename);

#endif
