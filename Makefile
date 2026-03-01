.PHONY: start stop status last cycles monitor team help clean-logs reset-consensus build-exe build-installer build-all clean-build

# === Quick Start ===

start: ## Start the auto-loop in foreground
	python auto_loop.py

start-awake: ## Start loop and prevent sleep while running (Unix only)
	@if command -v caffeinate >/dev/null 2>&1; then \
		caffeinate -d -i -s $(MAKE) start; \
	else \
		echo "caffeinate not available. This command is macOS only."; \
		exit 1; \
	fi

stop: ## Stop the loop gracefully
	python auto_loop.py --stop

# === Monitoring ===

status: ## Show loop status + latest consensus
	python monitor.py --status

last: ## Show last cycle's full output
	python monitor.py --last

cycles: ## Show cycle history summary
	python monitor.py --cycles

monitor: ## Tail live logs (Ctrl+C to exit)
	python monitor.py

# === Interactive ===

team: ## Start interactive Claude session with /team skill
	claude

# === Maintenance ===

clean-logs: ## Remove all cycle logs
	rm -f logs/cycle-*.log logs/auto-loop.log.old 2>/dev/null || del /Q logs\cycle-*.log logs\auto-loop.log.old 2>nul || true
	@echo "Cycle logs cleaned."

reset-consensus: ## Reset consensus to initial state (CAUTION)
	@echo "This will reset all progress. Ctrl+C to cancel."
	@sleep 3
	cp memories/consensus.md memories/consensus.md.backup
	@echo "Consensus backed up to memories/consensus.md.backup"
	@echo "Edit memories/consensus.md directly to reset."

# === Build & Installer ===

build-exe: ## Build standalone exe with PyInstaller
	@echo "Building HuluChat.exe with PyInstaller..."
	pyinstaller HuluChat.spec --clean
	@echo "✓ Built dist/HuluChat.exe"

build-installer: build-exe ## Build NSIS installer (requires makensis)
	@echo "Building NSIS installer..."
	@if command -v makensis >/dev/null 2>&1; then \
		makens installer/HuluChat.nsi; \
		echo "✓ Built dist/HuluChat-Setup-*.exe"; \
	else \
		echo "❌ makensis not found. Install NSIS from https://nsis.sourceforge.io/"; \
		exit 1; \
	fi

build-all: build-installer ## Build exe + installer

clean-build: ## Clean build artifacts (dist/, build/, spec file cache)
	@echo "Cleaning build artifacts..."
	@rm -rf dist build *.spec 2>/dev/null || del /Q /S dist build 2>nul || true
	@echo "✓ Build artifacts cleaned"

# === Help ===

help: ## Show this help
	@echo "Auto Company - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) 2>/dev/null || echo "  start       - Start the auto-loop in foreground"; \
	echo "  stop        - Stop the loop gracefully"; \
	echo "  status      - Show loop status + latest consensus"; \
	echo "  last        - Show last cycle's full output"; \
	echo "  cycles      - Show cycle history summary"; \
	echo "  monitor     - Tail live logs (Ctrl+C to exit)"; \
	echo "  team        - Start interactive Claude session"; \
	echo "  clean-logs  - Remove all cycle logs"; \
	echo "  build-exe   - Build standalone exe with PyInstaller"; \
	echo "  build-installer - Build NSIS installer"; \
	echo "  clean-build - Clean build artifacts"; \
	echo "  help        - Show this help"
	@echo ""
	@echo "Environment Variables:"
	@echo "  AUTO_MODEL           Claude model (default: opus)"
	@echo "  AUTO_LOOP_INTERVAL   Seconds between cycles (default: 30)"
	@echo "  AUTO_CYCLE_TIMEOUT   Max seconds per cycle (default: 1800)"
	@echo "  AUTO_MAX_ERRORS      Circuit breaker threshold (default: 5)"
	@echo "  AUTO_COOLDOWN        Cooldown after circuit break (default: 300)"
	@echo "  AUTO_LIMIT_WAIT      Wait on usage limit (default: 3600)"
	@echo "  AUTO_MAX_LOGS        Max cycle logs to keep (default: 200)"
	@echo ""
	@echo "Cross-platform: Works on Windows, macOS, and Linux"

.DEFAULT_GOAL := help
