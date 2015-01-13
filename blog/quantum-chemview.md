A molecular orbital is a function that describes an electron in a molecule. Representing those functions helps us understand how the electrons are distributed in the molecule.

In this post, we will learn how to read (or perform) quantum chemical calculation and visualize the mlecular orbitals without leaving the IPython notebook. 

The software stack will be:

- chemlab: For utilities
- cclib: To parse GAMESS output files
- chemview: To visualize molecular orbitals in the browser
- pyquante: To perform quantum chemical calculations

## Extracting the information from data files

Molecular Orbitals are typically produced as a result of some quantum chemical calculation. Typically those are represented using a basis set and some coefficients.

*What is a basis set? And which coefficients do we need?*
Straight from wikipedia

> A basis set in theoretical and computational chemistry is a set of functions (called basis functions) which are combined in linear combinations (generally as part of a quantum chemical calculation) to create molecular orbitals.

In other words, if a molecular orbital $f$ is a function expressed as a linear combination of $basis$ functions:

$$ f(x, y, z) = c_0 * basis_0(x, y, z) + c_1 * basis_1(x, y, z) + ... + c_n * basis_n(x, y, z)$$

All we need to calculate the molecular orbital is to evaluate the basis functions combine them using the coefficients.

To extract the basis set specification and their coefficients we can use chemlab (that internally uses cclib):

	from chemlab.io import remotefile
	df = remotefile("https://github.com/cclib/cclib/blob/master/data/GAMESS/basicGAMESS-US2012/water_mp2.out")
	coefficients = df.read('mocoeffs')
	basis_set = df.read('gbasis')

## Calculating the molecular orbitals at any point in space

Now that we have the specification we want to transform it into an usable python function that, x,y,z coordinates returns a value corresponding to the function. This can be accomplished through chemlab

	from chemlab.qc import molecular_orbital
	
	f = molecular_orbital(molecule.r_array, gbasis, coefficients)
	print(f(x, y, z))

## Visualizing the surfaces

One of the ways  to represent orbitals is to plot isosurfaces, that is surfaces where the function assumes a constant value $f(x,y,z) = c$. chemview implements a very easy way to render isosurfaces.

	mv = MolecularViewer()
	mv.wireframe()
	mv.add_surface(f, isovalue=0.3, color=0xff0000)
	mv.add_surface(f, isovalue=-0.3, color=0x0000ff)
	
	mv

When I started doing chemistry research in 2010, the set of tools available for the computational chemist were pretty old, I used to run and do calculations with GAMESS and read the output with Molden or VMD. Admittedly, that was painful, I'd really wish I had a way to have a centralize place to do my calculations.
