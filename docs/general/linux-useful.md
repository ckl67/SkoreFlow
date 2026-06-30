# Linux useful commands

[← back](./../index.md)

## directory tree

```shell

tree -I 'node_modules' -L 3

```

## Search

```shell
# exclude node_modules
find . -name "node_modules" -prune -o -name "package.json" -print

```

## Port used

```shell

# see all ports
sudo ss -tulnp

# see a specific port
sudo fuser 8080/tcp

# to kill a port
sudo fuser -k 8080/tcp
sudo fuser -k 5001/tcp

```
