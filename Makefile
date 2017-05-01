NAME :=shamelessjs
BABEL_PARAMS := src --out-dir build
BIN := ./node_modules/.bin

build: clean build-server

build-server:
	$(BIN)/babel $(BABEL_PARAMS)

watch: clean
	$(BIN)/concurrent -k "make watch-babel" "make watch-nodemon"

watch-babel:
	$(BIN)/babel -s inline --watch $(BABEL_PARAMS)

watch-nodemon:
	sleep 2
	$(BIN)/nodemon -e js,jsx,jade,md,json -w build build/index.js

clean:
	rm -rf build/
