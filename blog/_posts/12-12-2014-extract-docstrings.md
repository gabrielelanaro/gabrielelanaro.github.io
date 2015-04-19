---
title: How to extract docstrings from Python files with ast
layout: page
categories: blog
tags: python
include_js: ["http://d3js.org/d3.v3.min.js", "https://cdn.rawgit.com/Caged/d3-tip/4f6b0f4818e1ea88d47ab10cadd99675f2a76343/index.js"]
comments: true
---

In this post we will learn how to use the [ast] module to extract docstrings from Python files.

[ast]: https://docs.python.org/3/library/ast.html

## What is ast?

Simply put, [ast] is a module present in the standard library that can parse Python syntax. Its whole purpose is to read Python code and to break it down into its syntactic components. Let's explore this concept by analyzing a simple statement:

{% highlight python %}
a = 3 * (b + c)
{% endhighlight %}

To parse a statement with [ast], we can pass the code as a string to the function `ast.parse`.

{% highlight python %}
import ast
mod = ast.parse('a = 3 * (b + c)')
{% endhighlight %}

The function will return an instance of the `ast.Module` class that represents, simply put, a piece of code.

*How do we extract the contents of this piece of code?* --- `ast.Module` has an attribute called `body`, that lets you retrieve a list of all the syntactic expressions contained in this code:

{% highlight pycon %}
>>> mod.body
[<_ast.Assign at 0x494cc18>]
{% endhighlight %}

As you can see, the attribute body is a Python list containing a single element, of type `ast.Assignment`. Unsuprisingly this corresponds to the single assignment operation `a = value` that we performed.

*How do we retrieve the left and right components of the assignment?* --- Easily enough, the `ast.Assignment` has two attributes `targets` and `values` that contain exactly those two components.

{% highlight pycon %}
>>> assignment = mod.body[0]
>>> assignment.targets
[<_ast.Name at 0x494cd68>]
>>> assignment.value
<_ast.BinOp at 0x494c198>
{% endhighlight %}

<div class="tip">
    <p>To interactively explore which fields are available, each ast object exposes the attribute <code>_fields</code> containing a list of the available fields.</p>
</div>

As you can see, the targets are the value we are assigning to ( in this case it is a `ast.Name` object corresponding to the variable `a`), and the value is a binary operation, `ast.BinOp`, that corresponds to the expression `3 * (b + c)`. We can continue this process untill we decompose the expression into its prime components.

The end result of this process is called *Abstract Syntax Tree*. Each entity (`ast.Node`) can be decomposed in a recursive structure. The following scheme is an illustration of the Abstract Syntax Tree for the expression above (put your mouse on the nodes to reveal the code):

{% include tree-plot.html %}

## Getting all the functions

Now that we have a good understanding of how the parsing works, we can write a simple tool that takes a Python file and extracts all the toplevel function definitions.

The main idea is that we iterate over all the nodes in `Module.body` and we use `isinstance` to check if the node is a function definition. As an example, we'll parse the `ast` module itself, but you can use whatever module you want. To retrieve the location of the `ast` module we will use the following code:

{% highlight pycon %}
>>> import ast
>>> ast.__file__
'C:\\Users\\Gabriele\\Anaconda\\lib\\ast.pyc'
>>> # stripping the pyc and adding the py
>>> import os
>>> ast_filename = os.path.splitext(ast.__file__)[0] + '.py'
{% endhighlight %}

At this point we read the file as a string and we parse it with `ast`. Then, we iterate on the expression contained in the model and we collect all of the `ast.FunctionDef` instances:

{% highlight python %}
with fd as open(ast_filename):
    file_contents = fd.read()

module = ast.parse(file_contents)
function_definitions = [node for node in module.body if isinstance(node, ast.FunctionDef)]
{% endhighlight %}

If we want to see the function names, we can simply access the `name` attribute of `ast.FunctionDef`:

{% highlight pycon %}
>>> [f.name for f in function_definitions]
['parse',
 'literal_eval',
 'dump',
 'copy_location',
 'fix_missing_locations',
 'increment_lineno',
 'iter_fields',
 'iter_child_nodes',
 'get_docstring',
 'walk']
{% endhighlight %}

*How do we extract the docstrings?*--- Easy, you can use `ast.get_docstring` on a `ast.FunctionDef` object. The following code will print the name of each function and its documentation:

{% highlight python %}
for f in function_definitions:
    print('---')
    print(f.name)
    print('---')
    print(ast.get_docstring(f))
{% endhighlight %}

That will produce the following output:

    ---
    parse
    ---
    Parse the source into an AST node.
    Equivalent to compile(source, filename, mode, PyCF_ONLY_AST).
    ---
    literal_eval
    ---
    Safely evaluate an expression node or a string containing a Python
    expression.  The string or node provided may only consist of the following
    ...

So far we learned how to extract docstrings from function definitions, but *what about classes and methods?*

As you know, when you declare a class, you write a bunch of *function definitions* in the class *body* to declare its methods. This translates in `ast` as follows. Class definitions are represented as `ast.ClassDef` instances, and each `ast.ClassDef` object contains a `body` attribute that contains the function definitions (or methods). In the following example we first collect all the classes in the module, then for each class we collects its methods.

{% highlight python %}
class_definitions = [node for node in module if isinstance(node, ast.ClassDef)]
method_definitions = []

for class_def in class_definitions:
    method_definitions.append([node for node in class_def if isinstance(node, ast.FunctionDef])
{% endhighlight %}

At this point, extracting the docstring is a matter of calling `ast.get_docstring` on the collected `ast.FunctionDef` and `ast.ClassDef` objects.

For more `ast` goodness, please check out the [ official documentation](https://docs.python.org/3.4/library/ast.html).

Thank you for reading, and happy parsing!
