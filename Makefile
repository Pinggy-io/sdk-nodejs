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
	npx node-gyp clean

install:
	npm install --ignore-scripts

clean-install: clean install

build:
	npx node-gyp clean configure build
	node ./copy.js
	npm run build:tsc
	npm pack

clean-lib:
	rm -rf build lib dist pinggy-*.tgz
