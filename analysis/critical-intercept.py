import numpy as np
import scipy as sp
import pylab as pl
import glob

def dofits(alphas, cutin=3, cutout=-1):
    PEXP = (187./91-2)
    fig = pl.figure()

    b = np.linspace(0, 2e6, 1000)
    ps = 0*b

    slopes = []
    for a in alphas:
        t = np.loadtxt(glob.glob("trim-*"+str(a)+".txt")[0])
        for i,s in enumerate(b):
            ps[i] = ((t[:,2]+t[:,3]) >= s).astype('float').mean()

        x = (b**(36./91))[cutin:cutout]
        pl.plot(x, (ps*b**PEXP)[cutin:cutout], label=str(a))
        slope, intercept = np.polyfit(x, (ps*b**PEXP)[cutin:cutout], 1)
        pl.plot(x, slope*x + intercept)
        slopes.append(slope)
    pl.legend(loc='upper left')

    pl.figure()
    pl.plot(alphas, slopes, 'o-')
    return slopes
