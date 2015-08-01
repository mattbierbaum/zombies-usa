import numpy as np
import pylab as pl

#t = np.load('./summary-0.69572712.npy')
#h,_ = np.histogram(t, np.linspace(0,t.max(),t.max()))
#s = np.cumsum(h[::-1])[::-1]

#t2 = np.load('./summary-0.69572815.npy')
#h2,_ = np.histogram(t2, np.linspace(0,t2.max(),t2.max()))
#s2 = np.cumsum(h2[::-1])[::-1]

#t3 = np.hstack([np.load('./summary-0.695726-2.npy'),np.load('./summary-0.695726.npy')])
#h3,_ = np.histogram(t3, np.linspace(0,t3.max(),t3.max()))
#s3 = np.cumsum(h3[::-1])[::-1] 
0.69572677219097367

a = np.array([0.695726, 0.69572712, 0.69572815])
s = [np.load('./pgreater-'+str(i)+'.npy') for i in a]

alpha = (1-a)/a
tau = (187./91)-2
sigma = 36./91

def figure1():
    pl.figure()
    
    for talpha, ts in zip(a, s):
        x = np.arange(1, len(ts)+1)
        pl.plot(x**sigma, (1.0*ts*x**tau / ts[0]), '-', alpha=0.8, lw=2, label='%0.8f' % talpha)
    
    pl.xlabel(r"$s^{\sigma}$")
    pl.ylabel(r"$s^{\tau-2}P_{\geq s}$")
    pl.legend(loc='lower left')
    pl.ylim((0.602991, 0.604314))
    pl.xlim((0,320))

slopes = []
for talpha, ts in zip(a, s):
    x = np.arange(1, len(ts)+1)
    vx = x**sigma
    vy = (1.0*ts*x**tau / ts[0])

    mask = vx > 190

    x = vx[mask]
    y = vy[mask]

    tslopes = []
    for i in xrange(20):
        boot = np.random.choice(len(x), 20)#len(x)/100)
        tslopes.append(np.polyfit(x[boot],y[boot],1)[0])
    slopes.append(tslopes)
slopes = np.array(slopes)
