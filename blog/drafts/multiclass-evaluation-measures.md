# How to evaluate multiclass problems

In most machine learning courses a lot of emphasis is given to binary classification tasks. However, I found that the most useful machine learning tasks try to predict multiple classes and more often than not those classes are grossly unbalanced.

Given a generic problem, a very useful and intuitive measure is the **confusion matrix**. It is built from the list of predicted classes versus the true classes. To illustrate this with an example let's imagine we have a test set with the following labels:

A A A A C C C B B

and our model predicts:

A B A B C C C A B

We can see that sometimes instead of predicting A, our model predicts B. We can build a matrix by counting how many times a certain pair occurs. 
TODO: precision matrix picture
