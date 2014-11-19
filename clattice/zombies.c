#include <stdio.h>
#include <stdlib.h>
//#include <string.h>
#include <stdbool.h>
#include <time.h>

/*
 * choose a random Z site (that has S neighbors)
 * choose random neighbor, if not S, skip
 * choose random number x, if x < alpha, bit, else kill
*/

#define SS 0
#define SZ 1
#define SR 2
#define iswap(x, y) do { int _tempv_ = x; x = y; y = _tempv_; } while (0);
char SYMBOLS[] = {' ', 'X', '.'};

typedef struct {
    int N;
    int S, Z, R;
    float alpha;
    char *grid;

    // continuous list of active bonds (their locations)
    int nbonds;
    int *bonds;

    // true / false whether a bond exists
    int *bondgrid;

    // sites that have been filled
    int nsites;
    int *sites;
} world;

unsigned long long int vseed;
unsigned long long int vran;

void ran_seed(long j){
  vseed = j;  vran = 4101842887655102017LL;
  vran ^= vseed; 
  vran ^= vran >> 21; vran ^= vran << 35; vran ^= vran >> 4;
  vran = vran * 2685821657736338717LL;
}

double ran_ran2(){
    vran ^= vran >> 21; vran ^= vran << 35; vran ^= vran >> 4;
    unsigned long long int t = vran * 2685821657736338717LL;
    return 5.42101086242752217e-20*t;
}

int ran_int(int a, int b){ return (int)((b-a)*ran_ran2() + a); }
int mod(int a, int b){ return a - b*((int)(a/b)) + b*(a<0); }
int xy2ind(int N, int x, int y){ return x + N*y; }
void ind2xy(int N, int ind, int *x, int *y){ *x = ind % N; *y = ind / N; }

int inds2bond(int N, int ind0, int ind1){
    if (ind0 > ind1) iswap(ind0, ind1);

    int x0, y0, x1, y1;
    ind2xy(N, ind0, &x0, &y0);
    ind2xy(N, ind1, &x1, &y1);

    int level;
    if (y0 == y1){
        if (x1-x0 == -1 || x1-x0 == N-1) level=0;
        if (x1-x0 ==  1 || x1-x0 == 1-N) level=1;
    } else {
        if (y1-y0 == -1 || y1-y0 == N-1) level=2;
        if (y1-y0 ==  1 || y1-y0 == 1-N) level=3;
    }
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

void blank_world(world *w){
    w->S = w->N*w->N; w->Z = 0; w->R = 0;
    w->nbonds = 0;
    w->nsites = 0;

    /*memset(w->grid, 0, sizeof(w->grid));
    memset(w->bonds, ~0, sizeof(w->bonds));
    memset(w->bondgrid, ~0, sizeof(w->bondgrid));*/
    for (int i=0; i<4*w->N*w->N; i++){
        w->grid[i/4] = 0;
        w->sites[i/4] = 0;
        w->bonds[i] = -1;
        w->bondgrid[i] = -1;
    }
}

void reset_inplace(world *w){
    w->S = w->N*w->N; w->Z = 0; w->R = 0;

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

world *create_world(int N, float alpha){
    world *w = malloc(sizeof(world));
    w->N = N;
    w->alpha = alpha;

    w->grid = malloc(sizeof(char)*N*N);
    w->bonds = malloc(sizeof(int)*N*N*4);
    w->bondgrid = malloc(sizeof(int)*N*N*4);
    w->sites = malloc(sizeof(int)*N*N);

    blank_world(w);
    return w;
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
    int nextbind = ran_int(0, w->nbonds);
    int nextbond = w->bonds[nextbind];
    float test = ran_ran2();

    int ind0, ind1;
    bond2inds(w->N, nextbond, &ind0, &ind1);

    int ind = 0;
    int tx, ty;
    if (w->grid[ind0] == w->grid[ind1]){
        remove_bond(w, nextbond);
        return;
    }

    if (test < w->alpha){
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
    char header[] = "/* XPM */\nstatic char *mypic[] = {\n\"%i %i 3 1\",\n\". c black\",\n\"X c red\",\n\"  c white\",\n";
    char *contents = malloc(sizeof(char)*(w->N*w->N + 1280));

    int start = sprintf(contents, header, w->N, w->N);
    for (int j=0; j<w->N; j++){
        contents[start] = '\"';
        for (int i=0; i<w->N; i++)
            contents[start+i+1] = SYMBOLS[(int)w->grid[xy2ind(w->N, i, j)]];

        contents[start+w->N+1] = '\"';
        if (j != w->N-1){
            contents[start+w->N+2] = ',';
            contents[start+w->N+3] = '\n';
        } 
        start += w->N+4;
    }
    contents[start-2] = '\n';
    contents[start-1] = '}';
    contents[start+0] = '\n';
    contents[start+1] = '\0';

    FILE *f = fopen(filename, "w");
    fprintf(f, "%s", contents);
    fclose(f);
}

int main(int argc, char **argv){
    double alpha = 0.694;

    ran_seed(0);//time(NULL));

    if (argc == 2)
        alpha = atof(argv[1]);

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
