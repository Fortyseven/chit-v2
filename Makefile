# run blah
.PHONY: dev blah desktop

dev:
	npm run dev

blah:
	cd server && uv run -m backpack

desktop:
	npm run dev-desktop