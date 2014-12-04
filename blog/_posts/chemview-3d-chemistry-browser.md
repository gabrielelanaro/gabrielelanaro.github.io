---
layout: page
title: Chemview: 3D Chemistry for IPython Notebook
---

[IPython Notebook](http://ipython.org/notebook.html) is one of the most popular tools for data analysis. It basically lets your run Python scripts with an interactive notebook interface, allowing for runnable ''notebook'' that contains both text and data. I personally use it all the time for my research.

In the past month I've developed Chemview, an IPython notebook extensions that lets you display chemical system directly in the browser. This means that:

 - You don't have to switch programs to read/analyze/write your chemical data files.
 - You don't have to go through weird installation procedures. Chemview is a pure python module installable with pip, and, since it runs in the browser, it is automatically mutliplatform *and mobile enabled*.
 - You can build new way to visualize data using the convenient syntax of python. You can *create* new, more meaningful ways to display your result, so that you can find the patterns you're looking for.

## Demo

Viewing stuff in chemview is fairly easy. But since it deals only with
visualization we will use another program (mdtraj) to pull data from the web.

    import mdtraj as md
    traj = md.load_pdb('2M6K.pdb')
    print traj

    <mdtraj.Trajectory with 30 frames, 4462 atoms, 292 residues, and unitcells>


Chemview provides a class MolecularViewer and helpers to let you easily display
the protein using a cylinder and strand representation.


    from chemview import MolecularViewer, enable_notebook
    from chemview.contrib import topology_mdtraj
    enable_notebook()

    mv = MolecularViewer(traj.xyz[0], topology_mdtraj(traj))
    mv.cylinder_and_strand()
    mv


Want to know more? Check out the handcrafted [docs](https://chemview.readthedocs.org).
