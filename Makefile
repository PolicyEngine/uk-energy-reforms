.PHONY: install format lint test

install:
	uv sync --extra dev

format:
	uv run ruff format .

lint:
	uv run ruff format --check .
	uv run ruff check .

test:
	uv run pytest -q
