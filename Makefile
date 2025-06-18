.PHONY: clean clean-install

clean:
	rm -rf lib
	rm -rf node_modules
	rm -rf build
	rm -rf libpinggy-0.0.14-linux-x86_64.tgz
	rm -f libpinggy.so
	rm -f pinggy.lib
	rm -f pinggy.dll
	rm -f pinggy.dylib
	rm -f ../.prebuild-step-done
	rm -f .prebuild-step-done
	node-gyp clean

install:
	npm install

clean-install: clean install
