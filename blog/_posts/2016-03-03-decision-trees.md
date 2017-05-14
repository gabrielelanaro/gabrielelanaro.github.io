---
title: Implementing Decision Trees in Python
layout: page
tags: machine learning
categories: blog
comments: true
include_js: ["http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"]
---
I find that the best way to learn and understand a new machine learning method is to sit down and implement the algorithm. In this tutorial we'll work on decision trees in Python ([ID3/C4.5](https://en.wikipedia.org/wiki/C4.5_algorithm) variant).

As an example we'll see how to implement a decision tree for classification. Let's imagine we want to predict rain (1) and no-rain (0) for a given day. We have two predictors:

- ``x1`` is weather type (0 = partly cloudy, 1 = cloudy, 2 = sunny)
- ``x2`` is atmospheric pressure (0 = low, 1 = high)

we can make up some fake data to help us draft the first version of the algorithm.

{% highlight python %}
import numpy as np
x1 = [0, 1, 1, 2, 2, 2]
x2 = [0, 0, 1, 1, 1, 0]
y = np.array([0, 0, 0, 1, 1, 0])
{% endhighlight %}

The idea behind decision trees is that, given our training set, the method learns a set of _rules_ that help us classify a new example. An example rule could be: if the weather is partly cloudy and pressure is low, then it's going to rain.

Decision trees are very flexible (even too much) and are able to describe complicated relationships thanks to those easy-to interpret rules. But how do we derive such rules?

The idea is to split the data according to one (or multiple) attributes, so that we end up with sub-sets that (ideally) have a single outcome.

For example, if we split our training data by the attribute x1, we end up with 3 sets, and you can see how two of the splittings are pure, as they contain only zeros:

- ``x1 = 0: y = [0]``
- ``x1 = 1: y = [0, 0]``
- ``x1 = 2: y = [1, 1, 0]``

The splitting for ``x1 = 2`` is unfortunately not pure, therefore we need to split this set into even more subsets.

The code for splitting a set is fairly simple: the following routine takes an array as input and returns a dictionary that maps each unique value to its indices:

{% highlight python %}
def partition(a):
    return {c: (a==c).nonzero()[0] for c in np.unique(a)}
{% endhighlight %}
## Picking which attribute to split

An aspect that we need to figure out still is how to pick which attribute to use for the splitting. Ideally, we want the attribute that give us the better (purest) splits.

A standard measure of "purity" can be obtained by taking the opposite of a quantity called Shannon entropy (if you've ever taken thermodynamics, you'll know that entropy, is a measure of "disorder" in a system).

Let's assume we have a urn with red and green balls, we want a quantity that should be at its minimum when the urn is filled completely with green or red balls (minimum disorder), and at its minimum when we got half green and half red balls (maximum disorder). Given that $f_g$ is the fraction of green balls and $$f_r$$ is the fraction of red balls, taking the opposite of $$H$$ satisfies this property:

$$ H = - f_r log_2 (f_r) - f_g log_2 (f_g) $$

You can see, in fact, that if set is made of only red balls ($$f_r = 1$$ and $$f_g = 0$$), you obtain

$$ - 1 log_2(1) - 0 log_2(0) = 0 $$

$$ - 0.5 log_2(0.5) - 0.5 log_2(0.5) = 1 $$

The concept can be generalized with more than two ball colors, by extending the sum on the fractions of each of the components. The implementation of entropy is quite easy:

{% highlight python %}
def entropy(s):
    res = 0
    val, counts = np.unique(s, return_counts=True)
    freqs = counts.astype('float')/len(s)
    for p in freqs:
        if p != 0.0:
            res -= p * np.log2(p)
    return res
{% endhighlight %}

Now that we have a measure of purity, to select the most convenient attribute for splitting, we should check if the sets improves the purity than the un-splitted set.

This measure of purity improvement can be described mathematically through a quantity called mutual information (in the decision tree literature this is often referred as information gain).

Mutual information is the difference between the entropy of the unsplitted set, and the average of the entropy of each split, weighted by the number of elements in the subset. A concrete example is as follows:


$$ I(y, x) = H(y) - [p_{x=0} H(y|x=0) + p_{x=1} H(y|x=1))] $$

where:

- $$y$$ is the original set
- $$x$$ is the attribute we are using for splitting that assumes the values {0, 1}
- $$H(y\|x=k)$$ is the entropy of the subset that corresponds to the attribute value $$x=k$$, and $$p_{x=k}$$ is the proportion of elements in that subset. The implementation is again straightforward.

{% highlight python %}
def mutual_information(y, x):

    res = entropy(y)

    # We partition x, according to attribute values x_i
    val, counts = np.unique(x, return_counts=True)
    freqs = counts.astype('float')/len(x)

    # We calculate a weighted average of the entropy
    for p, v in zip(freqs, val):
        res -= p * entropy(y[x == v])

    return res
{% endhighlight %}
We are have all the ingredients to train a decision tree! To summarize, the general idea is as follow:

1. Select the most convenient attribute using the mutual information criterion.
2. Split using the selected attribute
3. For every subset, if the subset is not pure (or empty), recursively split this subset by picking another attribute (until you ran out of attributes).

The algorithm can be implemented recursively as follows. The tree is represented as a nested dictionary where each key corresponds to selecting a particular value for an attribute, the leaves of this tree are the corresponding subsets of y.  

{% highlight python %}
from pprint import pprint

def is_pure(s):
    return len(set(s)) == 1

def recursive_split(x, y):
    # If there could be no split, just return the original set
    if is_pure(y) or len(y) == 0:
        return y

    # We get attribute that gives the highest mutual information
    gain = np.array([mutual_information(y, x_attr) for x_attr in x.T])
    selected_attr = np.argmax(gain)

    # If there's no gain at all, nothing has to be done, just return the original set
    if np.all(gain < 1e-6):
        return y


    # We split using the selected attribute
    sets = partition(x[:, selected_attr])

    res = {}
    for k, v in sets.items():
        y_subset = y.take(v, axis=0)
        x_subset = x.take(v, axis=0)

        res["x_%d = %d" % (selected_attr, k)] = recursive_split(x_subset, y_subset)

    return res

X = np.array([x1, x2]).T
pprint(recursive_split(X, y))
{% endhighlight %}

<pre>
{'x_0 = 0': array([0]),
 'x_0 = 1': array([0, 0]),
 'x_0 = 2': {'x_1 = 0': array([0]), 'x_1 = 1': array([1, 1])}}
</pre>

You can easily verify that the rule learned make sense, the algorithm split the target in 4 pure sets, each one corresponding to a different rule, and that can be use to predict new input.

There's much more about decision trees, but with these building blocks is not too hard to understand how to go about it:

**How do we handle numerical predictors?** those are usually handled by, splitting the input in two based on threshold value. How do we select the right threshold value? Let's say we have 3 data points x = {0.1, 0.2, 0.3}, we can make two different splits based on threshold values:

- $$x_{thr} = 0.1$$: {0.1} {0.2, 0.3}
- $$x_{thr} = 0.2$$: {0.1, 0.2} and {0.3}

At this point, we can just select the best attribute using the mutual information criterion and we're golden.

**How do we handle numerical output?** In this case, we need a different measure of purity, as entropy doesn't make much sense with numerical predictors. In this case we may use the "variance" as a measure of purity for the set, if variance is low, it means that all the values are close to each other.

**How about the CART algorithm? How is that different?** The CART algorithm (Classification and Regression Trees) uses a somewhat different strategy but the idea is the same:

- Instead of entropy, another quantity called Gini index is used.
- The splits are always binary. Going back on our initial example, a valid split for CART would have been {x=0} {x=1 or x=2} instead of the three-way split we implemented {x=0}, {x=1}, {x=2}.


There are many more questions and details to be addressed (depth limits, pruning, feature importance), and with this background hopefully you will be able to easily understand those very important aspects (or let me know if you'd like another post discussing them!)

**Additional resources**

- Collection of videos that clearly explain the algorithm <https://www.youtube.com/watch?v=eKD5gxPPeY0>
- Paper that explains the difference between CART, ID3 and C4.5 <http://www.cs.uvm.edu/~icdm/algorithms/10Algorithms-08.pdf>
