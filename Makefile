RIPPLE_LIB = node_modules/ripple-lib/package.json

all: xmm.js $(RIPPLE_LIB) stop
	if [ -f full.log ]; then \
		cat full.log >>archive.log; \
	fi
	nohup node xmm.js >full.log 2>&1 & echo $$! >daemon.pid
	sleep 5

$(RIPPLE_LIB):
	npm install ripple-lib@0.10.0

stop:
	-if [ -f daemon.pid ]; then \
		kill "`cat daemon.pid`"; \
		rm -f daemon.pid; \
	fi
	sleep 5

clean: stop
	-rm -i *.log history.json
	-rm -fr node_modules
