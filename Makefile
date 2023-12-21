.DEFAULT_GOAL := help

# Variables
PYTHON := python
PIP := pip
FLAKE8 := flake8
PYTEST := pytest
MANAGE := manage.py
SETTINGS := coordinates.settings

# Targets
.PHONY: help setup lint test clean

## Show help message
help:
	@echo "Available targets:"
	@echo "  setup        Install project dependencies"
	@echo "  lint         Run linters"
	@echo "  test         Run tests using pytest"
	@echo "  clean        Clean up temporary files and caches"

## Install project dependencies
setup:
	$(PIP) install -r requirements.txt

## Run linters
lint:
	$(FLAKE8) . --exclude=migrations

## Run tests using pytest
test:
	$(PYTEST) -s

## Clean up temporary files and caches
clean:
	find . -type f -name '*.pyc' -delete
	find . -type d -name '__pycache__' -exec rm -r {} +
	rm -rf .pytest_cache

## Run Django management command (example: make manage cmd="runserver")
manage:
	$(PYTHON) $(MANAGE) $(cmd) --settings=$(SETTINGS)

