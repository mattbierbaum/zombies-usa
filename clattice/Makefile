EXE=do_snap do_stats do_snap_series do_snap_large
OBJECTS=pcg_basic.o zombies.o
CFLAGS=-std=c99 -Wall -Wextra -Werror -pedantic -flto -O3 -Ofast -m64 -march=native -fopenmp -D_POSIX_C_SOURCE=199309L
LDLIBS=-lm -lrt -g
CC=c99

WARNS=-Wwrite-strings -Winit-self -Wcast-align -Wcast-qual -Wpointer-arith -Wstrict-aliasing=2
WARNS += -Wformat=2 -Wmissing-declarations -Wmissing-include-dirs -Wno-unused-parameter -Wuninitialized
WARNS += -Wold-style-definition -Wstrict-prototypes -Wredundant-decls -Wno-missing-braces -Wpointer-arith
WARNS += -Winline -Wunreachable-code -Wfloat-equal -fstack-protector-all -Wstack-protector --param ssp-buffer-size=4
WARNS += -ftrapv
#CFLAGS += $(WARNS)

.PHONY: all clean

all: $(EXE)

clean:
	rm $(EXE) $(OBJECTS)

$(EXE): $(OBJECTS) 
