# How to evaluate multiclass problems

In most machine learning courses a lot of emphasis is given to binary classification tasks. However, I found that the most useful machine learning tasks try to predict multiple classes and more often than not those classes are grossly unbalanced.

One example of that was the AirBnB kaggle competition, in which I recently participated with Francesco Pochetti.

Given a generic problem, a very useful and intuitive measure is the **confusion matrix**. It is built from the list of predicted classes versus the true classes. To illustrate this with an example let's imagine we have a test set with the following labels:

```
A A A A C C C B B
```

and our model predicts:

```
A B A B C C C A B
```

We can see that sometimes instead of predicting A, our model predicts B. We can build a matrix by counting how many times a certain pair occurs. In this case we have:

```
A A -> 2
A B -> 2
A C -> 0
B A -> 1
B B -> 2
B C -> 0
C A -> 0
C B -> 0
C C -> 3
```

By putting those counts in a table, we obtain the confusion matrix (see below picture). The usefulness of the confusion matrix lies in its interpretability, it is obvious by looking at it where the problem lies with our model. In this case ``C`` is predicted perfectly while we got some problems with ``A``.

![text4384.png]({{site.baseurl}}/blog/drafts/text4384.png)

Sometimes, especially when optimizing model parameters, it is useful to have a single value that summarizes the content of the table. Unfortunately there is no single answer to this question, but one can choose an appropriate metric, depending on the problem at hand.

**Precision**: is the number of correct prediction divided by the number of total predictions made. Intuitively, a high precision for a class means that if our models predict that class, it is very likely to be true. A high precision model will be useful in those situations where we need to have an high confidence in our prediction (for example in medical diagnosis).

Precision can be calculated separately for each class. Graphically, for each row, we take the number on the diagonal, and divide it by the sum of all the elements in the column.

```
prec_A = 2/3
prec_B = 2/4
prec_C = 3/3
```

The drawback of precision is that, if you have a problem where there are 1000 instances of A, if the model predicts gives a single prediction for A, and the prediction is correct, it will have a perfect score of 1. What about the fact that the model failed to detect the other 999 instances of A? The other side of the coin is recall.

**Recall** is the number of correct predictions divided by the total number of elements present in that class. Graphically, it is the value on the diagonal, divided by the sum of the values in the row. If recall is high, it means that our models manages to recover most instances of that class. Obtaining high recall is very easy, it's sufficient to say that everything matches that class, and you can be sure that all the elements are retrieved.

```
recall_A = 2/4
recall_B = 2/3
recall_C = 3/3
```

As you can see in the case of C, if we recover all classes, and all our prediction are correct, we obtain a perfect score for both precision and recall.

**F1-score**: f1 score is the geometric average of precision and recall, and acts as a combined measure of the too (see also f$$_beta$$ score).

**Micro and macro averages*

To extract a single number from the class precision, recall and f-score, it is possible to take an average value, there's two way to go at it.

The first, is to compute the score separately for each class and then taking the average value --- this is called "macro averaging". This kind of averaging is useful when the dataset is unbalanced and we want to put the same emphasis on all the classes.

$$
\frac \textrm{recall_A + recall_B + recall_C}3
$$$
The second is to calculate the measure from the grand total of the numerator and denominator, this is called *micro averaging*. For our recall example:

```
2 * 2 * 3 / 4 + 3 + 3
```

Now let's imagine our label A has 4000 instances, and 2000 are correctly predicted.

**accuracy**: accuracy is another measure that can be useful in certain situations, especially when the problem has well balanced classes (for example in optical character recognition) and we want to put an emphasis on exact matches. Unforunately accuracy suffers on unbalanced data sets, a typical example is information retrieval. 

**cross entropy**: sometimes we are not interested in the class predictions, instead, we are trying to model the class probabilities themselves(how probable is each class given the predictors?).

Cross entropy measures how good the predicted probabilities match the given data. This is calculated using the following formula:
 
 $$
 - \Sum_i^N y_i \ln p_i
 $$
 
 Notice that cross-entropy is often called *log-loss*, because it can be used as a loss function in logistic regression, and *binomial deviance*, because it is the deviance of a binomial distribution.

As cross entropy deals with probabilities, it evaluates the overall goodness of model, and it is often used in data science competition.

TODO: references (wikipedia, link su evernote)

Being a sum over every data point, this measure is also affected by heavily skewed data sets.

**dcg** or discounted cumulative gain was the measure used in the AirBnB Kaggle competition, this measure is appropriate when dealing with ranked results.


