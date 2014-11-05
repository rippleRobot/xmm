RIPPLE_LIB = node_modules/ripple-lib/package.json

all: xmm.js $(RIPPLE_LIB)
	node xmm.js

$(RIPPLE_LIB):
	npm install ripple-lib

clean:
	-rm -fr node_modules
