When I started doing chemistry research in 2010, the set of tools available for the computational chemist were pretty old, I used to run and do calculations with GAMESS and read the output with Molden or VMD. Admittedly, that was painful, I'd really wish I had a way to have a centralize place to do my calculations.

In this tutorial we'll learn how to read (or perform) quantum chemical caluclation and visualize the moelcular orbitals without leaving the IPython notebook. The software we'll use will be:

- chemlab: To read output files
- chemview: To visualize molecular orbitals in the browser
- pyquante: To perform quantum chemical calculations


As chemview is only a visualization library, we need to use something else to produce/get the data for the molecular orbital. In this example we'll visualize water molecular orbitals extracted from a GAMESS-US calculation using the library `cclib`.

https://github.com/cclib/cclib/blob/master/data/GAMESS/basicGAMESS-US2012/water_mp2.out

## Extracting the molecular orbitals

What are molecular orbitals? In the most general way possible are functions defined in 3D space, basically they assume a value for each point in space $f(x, y, z) \in R$. One of the ways  to represent orbitals is to plot isosurfaces, that is surfaces where the function assumes a constant value $f(x,y,z) = c$.

I'm not going to go in detail what's necessary to calculate the molecular orbitals but I'm just gonna outline the procedure used to extract this information from a quantum chemical calculation.

With cclib you can read the gamess file in this way:

	import cclib
	gms = cclib.read('gamess.out')
	gms.read = 0

## Options to generate data

PyQuante
Orca
GAMESS
Gaussian

> Written with [StackEdit](https://stackedit.io/).
