title: Write your custom latex bibliography style in 5 minutes
layout: post
--

You're ready to submit your paper, but there's one last thing your supervisor/publisher/teacher requests you, only a _slight_ modification to the bibliography style:

    Why don't you put the date in bold, and semicolon between author names?

Latex distributions usually come with plenty of styles available, and most scientific journals provide their own style. Sometimes however this is not enough as for a reason or another you have to resort to a custom style. Altought the process is not as straighforward as I expected it to be (as often happens with LaTeX), it is definitely simple. 

When you include a bibliography with bibtex, you tipically have a structure like this:

    // File main.tex
    \usepackage{...}
    
    \begin{document}
    \end{document}
    
    \bibliographystye{plain}
    \bibliography{list}

And the project would contain a file named list.bib that contains the bibliography in bibtex style. Bibliography styles are defined by files with extension bst (in the previous example I used the style plain.bst located in). 

# Creating a custom bst file

Open a terminal and type:
  
  latex makebst 
  
This program will ask you questions and build a custom bibliography style. It's a lot of questions, if you're unsure just press enter and he will select a default value. At the end it will ask you if you want to proceed to compile your bst file.

# Installing your bst file

To apply your new style (let's assume you assigned the filename mystyle.bst), issue the following commands to install the style file locally:

   mkdir -p ~/texmf/bibtex/bst
   cp mystyle.bst ~/texmf/bibtex/bst/
   texhash ~/texmf # Make TeX aware of what you just did

Finally, apply the bibliography style in the main.tex file.

   \bibliographystyle{mystyle}

Submit, grab a cup of coffee, and relax.

source: http://chgarms.com/archives/87
