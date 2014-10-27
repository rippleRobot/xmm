RIPPLE_SRC = node_modules/ripple-lib/src/js/ripple/remote.js
RIPPLE_FIX = $(RIPPLE_SRC).fix

all: xmm.js $(RIPPLE_FIX)
	node xmm.js

$(RIPPLE_FIX):
	npm install ripple-lib@0.7.37
	patch $(RIPPLE_SRC) patch.diff
	touch $@

clean:
	-rm -fr node_modules
