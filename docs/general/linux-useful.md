# Linux useful commands

## directory tree

```shell

tree -I 'node_modules' -L 3

```

## Search

```shell
# exclude node_modules
find . -name "node_modules" -prune -o -name "package.json" -print

```
