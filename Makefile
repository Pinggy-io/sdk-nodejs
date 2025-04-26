# Makefile

.PHONY: clean build

clean:
	rm -f .prebuild-step-done lib/addon.node libpinggy.so

build:
	export LD_LIBRARY_PATH="$(PWD)" && npm install
