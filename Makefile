# A small makefile to remember the commands

serve:
	bundle exec jekyll serve --watch

build:
	jupyter nbconvert \
	--NbConvertApp.output_files_dir="public/post_resources/{notebook_name}" \
	--output-dir blog/_posts \
	notebooks/2020-05-08-pyro-probabilistic.ipynb \
	--to markdown

	# Modify the paths of the images
	sed -i 's/(public/(\/public/g' blog/_posts/2020-05-08-pyro-probabilistic.md
	# Removed empty line beginning of file
	sed -i '1d' blog/_posts/2020-05-08-pyro-probabilistic.md
	cp -r blog/_posts/public/post_resources/* public/post_resources
	rm -r blog/_posts/public

.PHONY: serve build