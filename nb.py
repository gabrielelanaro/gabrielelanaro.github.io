'''Convert a notebook to markdown'''
import sys
import json

nbfile = sys.argv[1]

nb = json.load(open(nbfile))


ret = ''

code_tpl = '''
{{% highlight python %}}
{}
{{% endhighlight %}}
'''

output_tpl = '''
```
{}
```
'''
for cell in nb['cells']:
    if cell['cell_type'] == 'markdown':
        ret += ''.join(cell['source'])
        ret += '\n'

    elif cell['cell_type'] == 'code':
        ret += code_tpl.format(''.join(cell['source']))

        for output in cell['outputs']:
            ret += output_tpl.format(''.join(output['text']))

    else:
        pass

print(ret)
