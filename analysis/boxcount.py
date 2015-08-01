import numpy as np
import pylab as pl
import scipy.ndimage as nd
import scipy.optimize as opt
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

def single_fit(name):
    image = pl.imread(name)
    #binary = 1 - 1*(image != 0)
    #binary = 1*(image != 0)
    binary = 1*(image.mean(axis=-1) != 1)
    tb, ta = getcurve(binary)
    fit = exponent(tb, ta)
    #fit[0] = -91./48
    pl.figure()
    pl.imshow(binary)
    pl.figure()
    pl.loglog(tb, ta, 'o')
    pl.loglog(tb, powerlaw(fit, tb, ta), '-')
    return fit

def analyze_all():
    exps = []
    fig = pl.figure()

    files = glob.glob('./*.png')
    files.sort()

    for ind, pic in enumerate(files):
        if not os.path.exists(pic):
            continue
        print ind
        image = pl.imread(pic)
        binary = 1*(image.mean(axis=-1) != 1)

        tb, ta = getcurve(binary)
        fit = exponent(tb, ta)
        exps.append(fit[0])

        pl.loglog(tb, ta, 'o-')
        pl.loglog(tb, powerlaw(fit, tb, ta), '-')

    pl.show()
    return np.array(exps)

def diffeq(p, M, L):
    c1, c2, df, alpha = p
    return c1 + df*M**alpha - c2*L**(alpha*df)

def fit_simultaneous(M, L):
    return opt.leastsq(diffeq, [-257, 2.3, 1.85, 0.5], args=( M, L))[0]

def fitall():
    M,L = [], []

    for ind, pic in enumerate(glob.glob("./*.png")):
        print ind
        image = misc.imread(pic)
        binary = 1 - 1*(image == 1)
        M.append(binary.sum())
        L.append(max(binary.shape))

    L, M = [list(x) for x in zip(*sorted(zip(L, M), key=itemgetter(0)))]
    M, L = np.array(M), np.array(L)
    return M, L
    #return fit_simultaneous(M, L)

def binit(csv):
    dat = np.vstack([np.loadtxt(a, delimiter=',') for a in csv])
    lab = dat[:,0].astype('int')
    ind = np.unique(lab)
    z = nd.mean(dat[:,1], labels=lab, index=ind)
    return ind, z
