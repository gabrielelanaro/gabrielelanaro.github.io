---
title: Write your custom latex bibliography style in 5 minutes
layout: page
tags: latex, tutorial
categories: blog
comments: true
---

You're ready to submit your paper, but there's one last thing your supervisor/publisher/teacher requests you, only a _slight_ modification to the bibliography style:

> Why don't you put the date in bold, and semicolon between author names?

Latex distributions come with plenty of styles available, and some of them come directly from  journal publishers. Sometimes those are not enough and you have to resort to make a custom style. Altought the process is not as straighforward as I expected it to be (as often happens with LaTeX), it is definitely simple. 

When you include a bibliography with bibtex, you tipically have a structure like this:

{% highlight latex %}
% File main.tex
\documentclass{article}

\begin{document}
\end{document}

\bibliographystye{plain}
\bibliography{list}
{% endhighlight %}

And the project would contain a file named list.bib that contains the bibliography in bibtex style. Bibliography styles are defined by files with extension bst (in the previous example I used the style plain.bst located in). 

## Creating a custom bst file

Open a terminal and type:
  
{% highlight bash %}
latex makebst
{% endhighlight %}

This program will ask you questions and build a custom bibliography style. It's a lot of questions, if you're unsure just press enter and he will select a default value. At the end it will ask you if you want to proceed to compile your bst file.

## Installing your bst file

To apply your new style (let's assume you assigned the filename mystyle.bst), issue the following commands to install the style file locally:

{% highlight bash %}
mkdir -p ~/texmf/bibtex/bst
cp mystyle.bst ~/texmf/bibtex/bst/
texhash ~/texmf # Make TeX aware of what you just did
{% endhighlight %}

Finally, apply the bibliography style in the main.tex file.

{% highlight latex %}
\bibliographystyle{mystyle}
{% endhighlight %}

Submit, grab a cup of coffee, and relax.

Source: [http://chgarms.com/archives/87](http://chgarms.com/archives/87)
