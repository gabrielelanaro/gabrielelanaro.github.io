title: Write your custom latex bibliography style in 5 minutes
layout: post
--

Latex distributions usually come with plenty of styles available, and most scientific journals provide their own style.

Sometimes this is not enough as you do have to respond to someone else that will require you a custom style.

All it takes is:

Open a terminal and type:
  
  latex makebst 
  
This program will ask you questions. To make your own style. At the end it will ask you if you want to proceed to compile yoru bst file. Of course you want to.

Install the new bibliography style:

   mkdir -p ~/texmf/bibtex/bst
   cp mystyle.bst ~/texmf/bibtex/bst/
   texhash ~/texmf

Add the line

   \bibliographystyle{mystyle}

You're done.

source: http://chgarms.com/archives/87
