import numpy as np
import scipy as sp
import pylab as pl
import glob
import json
import re
from matplotlib.widgets import Slider

def loaddata(alphas=[]):
    files = glob.glob("dat-alpha-?.*.json")
    alphas, xs, ys = [],[],[]

    for f in files:
        g = re.search(r"dat-alpha-([0-9]\.[0-9]{1,}).json", f)
        alpha = float(g.groups()[0])

        t = np.array(json.load(open(f)))[:,1] #np.loadtxt(f, delimiter=',')[:,1]
        y,x = np.histogram(t, bins=np.logspace(0, 5, 30))#, normed=True)
        y,x = np.histogram(t, bins=np.linspace(1, t.max(), 30))#, normed=True)

        x = x[1:]#(x[1:] + x[:-1])/2
        x = x[1:]
        y = y[1:]

        alphas.append(alpha)
        xs.append(x)
        ys.append(y/(y*x).sum())

    return alphas, xs, ys

def rescale(alphas, xs, ys, alphac, sigma, tau):
    out = []
    for a,x,y in zip(alphas, xs, ys):
        out.append([
            x/abs(a-alphac)**(-1./sigma),
            x**(-tau)*y*abs(a-alphac)**(-1./sigma)
        ])
    return out

def plotall(alphas, xs, ys, alphac=2.25, sigma=1.86):
    fig = pl.figure(1)
    pl.clf()

    out = rescale(alphas, xs, ys, alphac, sigma)
    for a, o in zip(alphas, out):
        pl.loglog(o[0], o[1], 'o-', label=str(a))
    pl.legend()


#def slider_plot(alphas, xs, ys, alphac=0.439, sigma=0.397435897436, tau=1.01274038462):
#def slider_plot(alphas, xs, ys, alphac=0.433173076923, sigma=0.419951923077, tau=(187./91-1)):
#def slider_plot(alphas, xs, ys, alphac=0.442548076923, sigma=0.727163461538, tau=1.05528846154):
def slider_plot(alphas, xs, ys, alphac=0.441666666667, sigma=0.535657051282, tau=0):
    fig = pl.figure(2)
    pl.subplots_adjust(left=0.25, bottom=0.25)
    pl.clf()

    lines = []
    out = rescale(alphas, xs, ys, alphac, sigma, tau)
    for a, o in zip(alphas, out):
        lines.append(pl.loglog(o[0], o[1], 'o-', label=str(a))[0])

    #pl.axis([xs[0].min(), xs[0].max(), ys[0].min(), ys[0].max()])
    #pl.legend(loc='lower left')

    axcolor = 'white'
    axalpha = pl.axes([0.25, 0.1, 0.65, 0.03], axisbg=axcolor)
    axsigma = pl.axes([0.25, 0.15, 0.65, 0.03], axisbg=axcolor)
    axtau = pl.axes([0.25, 0.20, 0.65, 0.03], axisbg=axcolor)

    print alphac, sigma, tau
    salpha = Slider(axalpha, r"$\alpha$", 0.2, 0.6, valinit=alphac)
    ssigma = Slider(axsigma, r"$\sigma$", 0.05, 1.0, valinit=sigma)
    stau = Slider(axtau, r"$\tau$", -1.0, 2.0, valinit=tau)

    def update(val):
        alphac = salpha.val
        sigma = ssigma.val
        tau = stau.val
        print "alphac =", alphac, "sigma = ", sigma, 'tau = ', tau

        out = rescale(alphas, xs, ys, alphac, sigma, tau)
        for line, o in zip(lines, out):
            line.set_xdata(o[0])
            line.set_ydata(o[1])

            fig.canvas.draw_idle()

    salpha.on_changed(update)
    ssigma.on_changed(update)
    stau.on_changed(update)

