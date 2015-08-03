import numpy as np
import pylab as pl
from scipy.optimize import leastsq, curve_fit

def dofancylinearfit(x,y, x0=None, sigma=None):
    def line(x,m,b):
        return m*x+b
    
    out = curve_fit(line, x, y, x0, sigma=sigma)
    return out[0], np.sqrt(np.diag(out[1])), out[1]

#t = np.load('./summary-0.69572712.npy')
#h,_ = np.histogram(t, np.linspace(0,t.max(),t.max()))
#s = np.cumsum(h[::-1])[::-1]

#t2 = np.load('./summary-0.69572815.npy')
#h2,_ = np.histogram(t2, np.linspace(0,t2.max(),t2.max()))
#s2 = np.cumsum(h2[::-1])[::-1]

#t3 = np.hstack([np.load('./summary-0.695726-2.npy'),np.load('./summary-0.695726.npy')])
#h3,_ = np.histogram(t3, np.linspace(0,t3.max(),t3.max()))
#s3 = np.cumsum(h3[::-1])[::-1] 

a = np.array([0.695726, 0.69572712, 0.69572815])
s = np.load("./collapse-curves-trimmed.npy")

alpha = (1-a)/a
tau = (187./91)-2
sigma = 36./91

def slope_analysis():
    s = np.array([np.load('./pgreater-'+str(i)+'.npy') for i in a])

    x = (np.arange(len(s[0]))+1)
    y = (1.0*s*x**tau / s[:,0][:,None])
    x = x**sigma

    cut = np.abs(x-200).argmin()

    slopes = np.array([dofancylinearfit(x[cut:], y[i,cut:])[0][0] for i in xrange(3)])
    yerr = np.array([dofancylinearfit(x[cut:], y[i,cut:])[1][0] for i in xrange(3)])
    intercepts = []
    for i in xrange(int(1e3)):
        tmp_slopes = slopes + np.random.normal()*yerr
        slopefit = dofancylinearfit(alpha, tmp_slopes)[0]#, sigma=yerr)[0]
        intercepts.append(-slopefit[1]/slopefit[0])
    intercepts = np.array(intercepts)

def plotall():
    fig = pl.figure()
    
    for talpha, ts in zip(alpha, s):
        x = 10*np.arange(len(ts))+1
        #pl.plot(x**sigma, (1.0*ts*x**tau / ts[0]), '-', alpha=0.8, lw=2, label='%0.8f' % talpha)
        pl.plot(x**sigma, ts, '-', alpha=0.8, lw=2, label='%0.8f' % talpha)
    
    pl.xlabel(r"$s^{\sigma}$")
    pl.ylabel(r"$s^{\tau-2}P_{\geq s}$")
    pl.legend(loc='lower left')
    pl.ylim((0.602991, 0.604314))
    pl.xlim((0,320))
    pl.grid()
    pl.tight_layout()
