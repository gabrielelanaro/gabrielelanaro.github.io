---
title: "Room Prices Analysis (Part 3): Natural Language Modeling and Feature Selection with bag-of-words approach in Python."
categories: blog
layout: page
---

After looking on how to [scrape data], [clean it], [extract geographical information], we are ready to begin the modeling stage.

In the modeling stage we work to get the answers we need or we build the actual product. For the room prices analysis we are mostly interested which variables are correlated with a high price so that we can understand the market better, and we are also interested in how much can we believe in our numbers. In a case like that we want, given the data, to make *inferences* about the underlying process that produced the data.

Alternatively we may also be interested in *predicting* future values. Depending on what is the question we want to answer, we have to pick suitable methods.

# Exploratory data analysis

In every data analysis, the first thing to do is to get a feel for the data. Understand what are the variables into play, checking for correctness etc. Always be wary of the numbers you obtain, there could be hidden mistakes at all time.

First of all, let's take a look at the raw (actually cleaned data).

<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>bedrooms</th>
      <th>cats</th>
      <th>condo</th>
      <th>dogs</th>
      <th>furnished</th>
      <th>house</th>
      <th>latitude</th>
      <th>laundry</th>
      <th>longitude</th>
      <th>post_id</th>
      <th>price</th>
      <th>size_ft2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>count</th>
      <td> 92.000000</td>
      <td> 1014</td>
      <td>  0</td>
      <td> 1027</td>
      <td> 21</td>
      <td> 19</td>
      <td> 15013.000000</td>
      <td> 18276</td>
      <td> 15013.000000</td>
      <td> 2.324600e+04</td>
      <td> 15438.000000</td>
      <td>   5089.000000</td>
    </tr>
    <tr>
      <th>mean</th>
      <td>  1.010870</td>
      <td>    1</td>
      <td>NaN</td>
      <td>    1</td>
      <td>  1</td>
      <td>  1</td>
      <td>    49.257344</td>
      <td>     1</td>
      <td>  -123.093584</td>
      <td> 4.940029e+09</td>
      <td>   654.075657</td>
      <td>    869.664767</td>
    </tr>
    <tr>
      <th>std</th>
      <td>  0.791362</td>
      <td>    0</td>
      <td>NaN</td>
      <td>    0</td>
      <td>  0</td>
      <td>  0</td>
      <td>     0.071436</td>
      <td>     0</td>
      <td>     0.509354</td>
      <td> 2.181358e+07</td>
      <td>   189.294457</td>
      <td>   4101.154188</td>
    </tr>
    <tr>
      <th>min</th>
      <td>  0.000000</td>
      <td>    1</td>
      <td>NaN</td>
      <td>    1</td>
      <td>  1</td>
      <td>  1</td>
      <td>    43.652228</td>
      <td>     1</td>
      <td>  -124.520477</td>
      <td> 4.874334e+09</td>
      <td>   300.000000</td>
      <td>      1.000000</td>
    </tr>
    <tr>
      <th>25%</th>
      <td>  1.000000</td>
      <td>    1</td>
      <td>NaN</td>
      <td>    1</td>
      <td>  1</td>
      <td>  1</td>
      <td>    49.240830</td>
      <td>     1</td>
      <td>  -123.132071</td>
      <td> 4.922212e+09</td>
      <td>   500.000000</td>
      <td>    189.000000</td>
    </tr>
    <tr>
      <th>50%</th>
      <td>  1.000000</td>
      <td>    1</td>
      <td>NaN</td>
      <td>    1</td>
      <td>  1</td>
      <td>  1</td>
      <td>    49.261026</td>
      <td>     1</td>
      <td>  -123.108394</td>
      <td> 4.938610e+09</td>
      <td>   600.000000</td>
      <td>    740.000000</td>
    </tr>
    <tr>
      <th>75%</th>
      <td>  1.000000</td>
      <td>    1</td>
      <td>NaN</td>
      <td>    1</td>
      <td>  1</td>
      <td>  1</td>
      <td>    49.278292</td>
      <td>     1</td>
      <td>  -123.063698</td>
      <td> 4.959753e+09</td>
      <td>   750.000000</td>
      <td>   1000.000000</td>
    </tr>
    <tr>
      <th>max</th>
      <td>  4.000000</td>
      <td>    1</td>
      <td>NaN</td>
      <td>    1</td>
      <td>  1</td>
      <td>  1</td>
      <td>    49.823690</td>
      <td>     1</td>
      <td>   -79.380315</td>
      <td> 4.979569e+09</td>
      <td>  1500.000000</td>
      <td> 145085.000000</td>
    </tr>
  </tbody>
</table>

As you can see we have a set of features extracted from the attributes, unfortunately out of all the samples we only get a few 'ones' and that constitutes a problem.

We can see what is the predictive power of each of these guys by doing some nice plotting.

# Simple modeling with natural-language: bag-of-words approach

But that's not all the features we have. In fact, a great deal of information comes from the content of the postings, that obviously contains nuances on the actual state of the house. Understanding natural language (and unstructured data in general) is quite a challenge but, at least for our purposes, it can be effectively addressed with a simple method, the *bag of words*.

The idea is to transform the posting text in a vector. Each vector element represent a word in the english vocabulary (or a subset thereof), if the word is present, the vector element is set to 1, or 0 otherwise.

[TODO: image]

An even better approach (and the one I used) is to employ digrams, that is to take into account pairs of words instead of single words. For example the sentence.

   python is a dynamic language

Would produce the following digrams.

   python is
   is a
   a dynamic
   dynamic language

The natural generalization is to use ``n-grams``, however, this can quickly produce a huge number of features that is not advisable.

After transforming our input to a bag-of-word (actually a bag of digrams) representation, we have increased our feature space to be high-dimensional.

High dimensionality is a big problem and many methods fail or become ineffective (see curse of dimensionality), therefore we'll use some techniques to select the best, most-relevant features.

# Feature selection

To think that every single word is important for the price of a room would be naive. Of all those many features only few of them have an effect on the price, to extract those important features there are a variety of different approaches, I personally prefer the simple ones.

First of all, some very frequent words like articles and prepositions, will appear in most documents but bear no significance, those are called stop words and can be safely removed automatically.

A very simple approach to identify the most relevant features is to run a linear regression using one predictor at a time and to pick only the features that have a (statistically) significant effect on the price. This is already implemented in the package scikit-learn.

CODE

As you can see we selected the 200 most important features between words and digrams, the one that have the biggest effect on price.

Now that we have a more manageable set of candidates we can fine-tune our feature selection and get say, the most important features. To do this we'll use a combination of the *lasso* and the cross-validation.

## The Lasso

Lasso is one of my favourite techniques, it is similar to a standard linear regression, where we minimize the sum of squares, but instead of minimizing only the sum of squares, we also add the constraint that the sum of the absolute value of the coefficients should be less than a value *t*, selected by the user.

One important caveat of the lasso is that the coefficient are able to shrink to exactly zero (effectively eliminating them out of the equation), removing the useless ones.

Fantastic, the only problem left is finding the optimal value of *t*. Such parameter optimization is usually handled by a procedure called [cross validation](TODO).

Let's aassume we have our training data. The wrong approach to find *t* is to run many different lasso regressions with a different t each, and picking the model that produces the results closest to the data. This is wrong because we're optimizing the parameter *t* for the training data, and not for actual real-world data we may encounter.

The right approach is to perform cross validation. We can split the data in 3 (more generally k) sets, we train the model using the first two sets and we optimize the parameter on the third one. Also, we do the same procedure by selecting other two sets for training and the remaining for optimizing *t*.

TODO Figure

Why didn't we use Lasso from the beginnning? Well, cross validation and regression would become extremely time-consuming.

# The Model

Now that we have our hands on the most important features we can construct a simple model. Since we're interested in inference rather than prediction we want to pick something simple like a linear regression.

But instead of using scikit learn we'll use statsmodels, as it gives us a more complete statistical treatment for the regression.

By running the analysis we can see how much each word affects the price and by how much.

A simple linear regression like that allows us to easily *control* for counfounding variables. For example, by including the neigh variable, we are able to calculate how much each variable is affected, independent of the neighbourhood.

# Other models

Another common model that do not overfit and is able to handle lots of features is random forest. However, while it gives a better accuracy overall, it doesn't provide good inference.

ElasticNet is another thing you should look into because deals with mutlicollinear stuff.
