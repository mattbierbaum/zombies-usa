import numpy as np
import scipy.ndimage as nd
import scipy.optimize as opt
from subprocess import check_output
from scipy import misc
import copy
import glob
import os
from operator import itemgetter

def coarse_grain(field, factor=2, majority=1):
    return (nd.filters.convolve(field, np.ones((factor,factor)))[::factor, ::factor] >= majority).astype('int')

def getcurve(field):
    scale = []
    boxes = []
    tmp = copy.copy(field)
    for i in xrange(int(np.log2(min(field.shape)))):
        scale.append(2**i)
        tmp = coarse_grain(tmp)
        boxes.append(tmp.sum())

    return np.array(scale), np.array(boxes)

def powerlaw(p, b, a):
    alpha, C = p
    return C*b**alpha

def powerlaw_fit(p,bs,bc):
    result = (bc - powerlaw(p,bs,bc))/bc
    return result

def exponent(boxes, areas, dim=2, lower=2, upper=2):
    tb = boxes[lower:-upper]
    ta = areas[lower:-upper]
    p = opt.leastsq(powerlaw_fit, [-2,1e5], args=(tb,ta))
    return p[0]

def analyze_all(size=8196, N=10000):
    current = 0

    filename = '/tmp/test.bin'+str(size)+str(np.random.random())

    N = N or int(1e8)
    for i in xrange(N):
        check_output(['do_snap_large', filename, str(size)])

        image = np.fromfile(filename, dtype='uint8')
        sidelen = np.sqrt(image.shape[0])
        image = image.reshape(sidelen, sidelen)

        binary = 1*(image != 0)

        tb, ta = getcurve(binary)
        fit = exponent(tb, ta)
        print fit[0]

""" unbuffer python continuous_boxcount.py 8192 > file.txt """
if __name__ == "__main__":
    import sys
    N = 10000
    size = 8196

    if len(sys.argv) > 1:
        size = int(sys.argv[1])
    if len(sys.argv) > 2:
        N = int(sys.argv[2])
    analyze_all(size=size, N=N)
