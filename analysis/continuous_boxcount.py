import matplotlib as mpl
mpl.use('Agg')
import pylab as pl

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

def analyze_all():
    current = 0
    
    filename = '/media/scratch/test.xpm'
    pic = '/media/scratch/test.png'
    while True:
        check_output(['do_snap_large', filename])
        check_output(['convert', filename, pic])

        image = pl.imread(pic)
        binary = 1*(image.mean(axis=-1) != 1)

        tb, ta = getcurve(binary)
        fit = exponent(tb, ta)
        print fit[0]

if __name__ == "__main__":
    analyze_all()
