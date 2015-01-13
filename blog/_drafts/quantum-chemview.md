---
title: Visualizing Molecular Orbitals in the IPython notebook
layout: page
tags: latex, tutorial
categories: blog
comments: true
include_js: ["http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"]
---

A molecular orbital is a function that describes an electron in a molecule. Visualizing those functions helps us understand how the electrons are distributed in the molecule.

In this post, we will learn how to read and visualize the mlecular orbitals from a quantum chemical calculation without leaving the IPython notebook. 

The software stack will be:

- [chemlab](http://chemlab.rtfd.org): For general utilities
- [cclib](http://cclib.github.io/): To parse GAMESS output files
- [chemview](http://chemview.rtfd.org): To visualize molecular orbitals in the browser

## Extracting the information from data files

Molecular orbitals are generally produced as a result of some quantum chemical calculation. Typically those are given to the user in the form of a basis set definition and the molecular orbitals coefficients.

*What is a basis set? And which coefficients do we need?*

The answer comes straight from [Wikipedia](http://en.wikipedia.org/wiki/Basis_set_%28chemistry%29)

> A basis set in theoretical and computational chemistry is a set of functions (called basis functions) which are combined in linear combinations (generally as part of a quantum chemical calculation) to create molecular orbitals.

In other words, a molecular orbital \\(f(x, y, z)\\) in quantum chemistry is commonly expressed as a linear combination of basis functions \\(b_i(x, y, z)\\):

$$ f(x, y, z) = c_0 * b_0(x, y, z) + c_1 * b_1(x, y, z) + ... + c_n * b_n(x, y, z)$$

All we need to calculate the molecular orbital is to evaluate the basis functions and combine them using the coefficients.

To extract the basis set specification and the molecular orbital coefficients we can use [chemlab](http://chemlab.rtfd.org) (that internally uses cclib). In the following code we retrieve a test calculation directly from the [cclib](http://cclib.github.io/) distribution and we extract:

- the molecule geometry ``molecule``
- the basis set specifcation ``gbasis``
- the coefficients `mocoeffs`. 

{% highlight python %}
from chemlab.io import remotefile
df = remotefile("https://github.com/cclib/cclib/blob/master/data/GAMESS/basicGAMESS-US2012/water_mp2.out")

molecule = df.read('molecule')
mocoeffs = df.read('mocoeffs')
basis_set = df.read('gbasis')
{% endhighlight %}

<div class='tip'>
<p>The file is an output file from the program <a href="http://www.msg.ameslab.gov/index.html">GAMESS</a>, performing an energy calculation of a water molecule using the <a href="http://en.wikipedia.org/wiki/M%C3%B8ller%E2%80%93Plesset_perturbation_theory">mp2</a> method.</p>	
</div>

We won't go in detail on how the ``gbasis`` format is structured, but it's easy to see what ``mocoeffs`` looks like:

{% highlight python %}
print(mocoeffs)
{% endhighlight %}

It is a list that contains a matrix of shape (8, 8), each row of this matrix is a set of coefficients corresponding to a given molecular orbital (In this file 7 molecular orbitals are specified).

## Molecular orbitals as functions

Now that we have the specification we want to transform it into an usable python function that, given a set of \\( (x ,y ,z) \\) coordinates returns a value corresponding to the function at that point. This can be accomplished through the ``chemlab.qc.molecular_orbital`` function. In the following snippet we create a function representing the 5th molecular orbital and we evaluate it at coordinate (0, 0, 0)

{% highlight python %}
from chemlab.qc import molecular_orbital

coefficients = mocoeffs[0][4] # 5th because we start counting from 0
f = molecular_orbital(molecule.r_array, gbasis, coefficients)
print(f(x, y, z))
{% endhighlight %}

## Visualizing the molecular orbitals as isosurfaces

One of the ways to visualize the molecular orbitals is to plot them as isosurfaces, those serve to give us a feeling of what the shape of the function looks like. 

Plotting isosurfaces is fairly easy with [chemview](http://chemview.rtfd.org). We first need to do the necessary imports:

{% highlight python %}
from chemview import enable_notebook, MolecularViewer
enable_notebook()
{% endhighlight %}

Next, we want to create a ``chemview.MolecularViewer`` instance and render the molecule as ball and sticks. To do this we also need to retrieve the molecule information from the data file.

{% highlight python %}
# Initialize molecular viewer
mv = MolecularViewer(molecule.r_array, { 'atom_types': molecule.type_array })
mv.ball_and_sticks()
{% endhighlight %}

Finally, we want to render the molecular orbital using the ``MolecularViewer.add_isosurface`` method. We render the surface for which the molecular orbital evaluates to 0.3 (positive sign) in blue, and the surface corresponding to an isovalue of -0.3 (negative sign) in red. 

{% highlight python %}
mv.add_isosurface(f, isovalue=0.3, color=0xff0000)
mv.add_isosurface(f, isovalue=-0.3, color=0x0000ff)

mv
{% endhighlight %}

You can now play around with the output.

When I started doing chemistry research in 2010, the set of tools available for the computational chemist were pretty old, I used to run and do calculations with GAMESS and read the output with Molden or VMD. Admittedly, that was painful, I'd really wish I had a way to have a centralize place to do my calculations.
