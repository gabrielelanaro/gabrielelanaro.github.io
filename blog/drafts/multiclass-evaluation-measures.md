# How to evaluate multiclass problems

In most machine learning courses a lot of emphasis is given to binary classification tasks. However, I found that the most useful machine learning tasks try to predict multiple classes and more often than not those classes are grossly unbalanced.

Given a generic problem, a very useful and intuitive measure is the **confusion matrix**. It is built from the list of predicted classes versus the true classes. To illustrate this with an example let's imagine we have a test set with the following labels:

A A A A C C C B B

and our model predicts:

A B A B C C C A B

We can see that sometimes instead of predicting A, our model predicts B. We can build a matrix by counting how many times a certain pair occurs. In this case we have:

A A -> 2
A B -> 2
A C -> 0
B A -> 1
B B -> 2
B C -> 0
C A -> 0
C C -> 3
C B -> 0

TODO: precision matrix picture

By putting those counts in a table, we obtain the confusion matrix. The usefulness of the confusion matrix lies in its interpretability, it is obvious by looking at it where the problem lies with our model.

Sometimes however, especially when optimizing model parameters it is useful to have a single value. There are a series of measure that we can adopt, depending on the business problem.

**precision**: in the binary classification stage, precision is the number of correct prediction divided by the number of total predictions made. Intuitively, a high precision for a class means that if our models predict that class, it is very likely to be true. A high precision model will be useful in those situations where we need to be certain that a certain class is predicted correctly (for example in medical diagnosis).

In the multiclass case, precision can be calculated on a per-class base. Graphically, for each row, we take the number on the diagonal, and divide it by the sum of all the elements in the column.

**recall**: recall is the number of correct predictions divided by the total number of elements present in that class. Graphically, it is the value on the diagona, divided by the sum of the values in the row. If recall is high, it means 



**f_score**

**accuracy**

**cross entropy**

