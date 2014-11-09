RIPPLE_LIB = node_modules/ripple-lib/package.json

all: xmm.js $(RIPPLE_LIB) stop
	if [ -f full.log ]; then \
		cat full.log >>archive.log; \
	fi
	nohup node xmm.js >full.log 2>&1 & echo $$! >daemon.pid
	sleep 1
 
$(RIPPLE_LIB):
	npm install ripple-lib

stop:
	-if [ -f daemon.pid ]; then \
		kill "`cat daemon.pid`"; \
		rm -f daemon.pid; \
	fi
	sleep 1

clean: stop
	-rm -i *.log
	-rm -fr node_modules
