.PHONY: build

build:
	bash -c 'export LD_LIBRARY_PATH="$(PWD)"; which node; which npm; npm install'