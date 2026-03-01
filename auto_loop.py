#!/usr/bin/env python3
"""
Auto Company — 24/7 Autonomous Loop (Cross-Platform)
====================================================
Keeps Claude Code running continuously to drive the AI team.
Works on Windows, macOS, and Linux.

Usage:
    python auto_loop.py              # Run in foreground
    python auto_loop.py --daemon     # Run as daemon (Unix only)
    python auto_loop.py --stop       # Stop running loop

Config (env vars):
    AUTO_MODEL=opus                  # Claude model (default: opus)
    AUTO_LOOP_INTERVAL=30            # Seconds between cycles
    AUTO_CYCLE_TIMEOUT=1800          # Max seconds per cycle
    AUTO_MAX_ERRORS=5                # Circuit breaker threshold
    AUTO_COOLDOWN=300                # Cooldown after circuit break
    AUTO_LIMIT_WAIT=3600             # Wait on usage limit
    AUTO_MAX_LOGS=200                # Max cycle logs to keep
"""

import os
import sys
import json
import time
import shutil
import subprocess
import signal
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional

# === Configuration ===

class Config:
    def __init__(self):
        self.project_dir = Path(__file__).parent.absolute()
        self.log_dir = self.project_dir / "logs"
        self.memories_dir = self.project_dir / "memories"
        self.consensus_file = self.memories_dir / "consensus.md"
        self.prompt_file = self.project_dir / "PROMPT.md"
        self.pid_file = self.project_dir / ".auto-loop.pid"
        self.stop_file = self.project_dir / ".auto-loop-stop"
        self.state_file = self.project_dir / ".auto-loop-state"
        self.pause_file = self.project_dir / ".auto-loop-paused"

        # Environment overrides
        self.model = os.getenv("AUTO_MODEL", "opus")
        self.loop_interval = int(os.getenv("AUTO_LOOP_INTERVAL", "30"))
        self.cycle_timeout = int(os.getenv("AUTO_CYCLE_TIMEOUT", "1800"))
        self.max_errors = int(os.getenv("AUTO_MAX_ERRORS", "5"))
        self.cooldown = int(os.getenv("AUTO_COOLDOWN", "300"))
        self.limit_wait = int(os.getenv("AUTO_LIMIT_WAIT", "3600"))
        self.max_logs = int(os.getenv("AUTO_MAX_LOGS", "200"))

        # Ensure Agent Teams is available
        os.environ["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"

        self.loop_count = 0
        self.error_count = 0
        self.running = True


# === Logging ===

class Logger:
    def __init__(self, log_dir: Path, to_console: bool = True):
        self.log_dir = log_dir
        self.to_console = to_console
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.main_log = log_dir / "auto-loop.log"

    def log(self, message: str):
        """Write to main log file"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{timestamp}] {message}"
        with open(self.main_log, "a", encoding="utf-8") as f:
            f.write(line + "\n")
        if self.to_console:
            print(line)

    def log_cycle(self, cycle_num: int, status: str, message: str):
        """Write cycle-specific log"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{timestamp}] Cycle #{cycle_num} [{status}] {message}"
        with open(self.main_log, "a", encoding="utf-8") as f:
            f.write(line + "\n")
        if self.to_console:
            print(line)


# === State Management ===

class StateManager:
    def __init__(self, config: Config):
        self.config = config
        self.state = {
            "loop_count": 0,
            "error_count": 0,
            "last_run": None,
            "status": "stopped",
            "model": config.model
        }

    def load(self):
        """Load state from file"""
        if self.config.state_file.exists():
            try:
                with open(self.config.state_file, "r", encoding="utf-8") as f:
                    content = f.read()
                    # Parse simple key=value format
                    for line in content.strip().split("\n"):
                        if "=" in line:
                            key, value = line.split("=", 1)
                            if key in ["loop_count", "error_count"]:
                                self.state[key] = int(value)
                            else:
                                self.state[key] = value
            except Exception as e:
                print(f"Warning: Could not load state: {e}")

    def save(self, status: str):
        """Save state to file"""
        self.state["status"] = status
        self.state["last_run"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.state["loop_count"] = self.config.loop_count
        self.state["error_count"] = self.config.error_count

        content = f"""LOOP_COUNT={self.state['loop_count']}
ERROR_COUNT={self.state['error_count']}
LAST_RUN={self.state['last_run']}
STATUS={self.state['status']}
MODEL={self.state['model']}
"""
        with open(self.config.state_file, "w", encoding="utf-8") as f:
            f.write(content)


# === Consensus Management ===

class ConsensusManager:
    def __init__(self, config: Config, logger: Logger):
        self.config = config
        self.logger = logger

    def backup(self):
        """Backup consensus file"""
        if self.config.consensus_file.exists():
            backup_path = self.config.consensus_file.with_suffix(".md.bak")
            shutil.copy(self.config.consensus_file, backup_path)

    def restore(self):
        """Restore consensus from backup"""
        backup_path = self.config.consensus_file.with_suffix(".md.bak")
        if backup_path.exists():
            shutil.copy(backup_path, self.config.consensus_file)
            self.logger.log("Consensus restored from backup after failed cycle")

    def read(self) -> str:
        """Read consensus content"""
        if self.config.consensus_file.exists():
            with open(self.config.consensus_file, "r", encoding="utf-8") as f:
                return f.read()
        return "No consensus file found. This is the very first cycle."

    def validate(self) -> bool:
        """Validate consensus file format"""
        if not self.config.consensus_file.exists():
            return False
        content = self.read()
        required = [
            "# Auto Company Consensus",
            "## Next Action",
            "## Company State"
        ]
        return all(marker in content for marker in required)

    def get_full_prompt(self) -> str:
        """Build full prompt with consensus"""
        if not self.config.prompt_file.exists():
            raise FileNotFoundError(f"PROMPT.md not found at {self.config.prompt_file}")

        with open(self.config.prompt_file, "r", encoding="utf-8") as f:
            prompt = f.read()

        consensus = self.read()

        return f"""{prompt}

---

## Current Consensus (pre-loaded, do NOT re-read this file)

{consensus}

---

This is Cycle #{self.config.loop_count}. Act decisively."""


# === Log Rotation ===

class LogRotator:
    def __init__(self, config: Config, logger: Logger):
        self.config = config
        self.logger = logger

    def rotate(self):
        """Rotate old logs"""
        # Keep only latest N cycle logs
        cycle_logs = list(self.config.log_dir.glob("cycle-*.log"))
        if len(cycle_logs) > self.config.max_logs:
            cycle_logs.sort(key=lambda p: p.stat().st_mtime)
            to_delete = cycle_logs[:len(cycle_logs) - self.config.max_logs]
            for log in to_delete:
                log.unlink()
            self.logger.log(f"Log rotation: removed {len(to_delete)} old cycle logs")

        # Rotate main log if over 10MB
        if self.logger.main_log.exists():
            size = self.logger.main_log.stat().st_size
            if size > 10 * 1024 * 1024:  # 10MB
                old_log = self.config.log_dir / "auto-loop.log.old"
                shutil.move(self.logger.main_log, old_log)
                self.logger.log(f"Main log rotated (was {size} bytes)")


# === Claude CLI Runner ===

class ClaudeRunner:
    def __init__(self, config: Config, logger: Logger):
        self.config = config
        self.logger = logger

    def find_claude_cli(self) -> str:
        """Find claude CLI executable"""
        # Try common names
        for name in ["claude", "claude.exe", "claude.bat"]:
            path = shutil.which(name)
            if path:
                return path

        # Check common installation paths
        if sys.platform == "win32":
            paths = [
                Path(os.environ.get("LOCALAPPDATA", "")) / "Claude" / "claude.exe",
                Path(os.environ.get("PROGRAMFILES", "")) / "Claude" / "claude.exe",
                Path.home() / ".claude" / "bin" / "claude.exe",
            ]
        else:
            paths = [
                Path.home() / ".local" / "bin" / "claude",
                Path("/usr/local/bin") / "claude",
            ]

        for path in paths:
            if path.exists():
                return str(path)

        return "claude"  # Hope it's in PATH

    def run_cycle(self, prompt: str) -> tuple[int, str, dict]:
        """Run a single Claude cycle"""
        claude_path = self.find_claude_cli()

        output_file = self.config.log_dir / "temp_output.json"
        cycle_log = self.config.log_dir / f"cycle-{self.config.loop_count:04d}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"

        # Build command
        cmd = [
            claude_path,
            "--model", self.config.model,
            "--dangerously-skip-permissions",
            "--output-format", "json"
        ]

        self.logger.log_cycle(self.config.loop_count, "START", "Beginning work cycle")

        try:
            # Run claude CLI
            result = subprocess.run(
                cmd,
                input=prompt,
                capture_output=True,
                text=True,
                timeout=self.config.cycle_timeout,
                cwd=self.config.project_dir
            )

            output = result.stdout
            if result.stderr:
                output += "\n" + result.stderr

            # Save full output
            with open(cycle_log, "w", encoding="utf-8") as f:
                f.write(output)

            # Extract metadata
            metadata = self.extract_metadata(output)

            return result.returncode, output, metadata

        except subprocess.TimeoutExpired:
            self.logger.log_cycle(self.config.loop_count, "TIMEOUT",
                                 f"Timed out after {self.config.cycle_timeout}s")
            return 124, "", {"timed_out": True}

        except Exception as e:
            self.logger.log_cycle(self.config.loop_count, "ERROR", str(e))
            return 1, "", {}

    def extract_metadata(self, output: str) -> dict:
        """Extract metadata from JSON output"""
        metadata = {
            "timed_out": False,
            "result_text": "",
            "cost": "",
            "subtype": "",
            "type": ""
        }

        try:
            # Try to parse as JSON
            data = json.loads(output)
            metadata["result_text"] = data.get("result", "")[:2000]
            metadata["cost"] = data.get("total_cost_usd", "")
            metadata["subtype"] = data.get("subtype", "")
            metadata["type"] = data.get("type", "")
        except json.JSONDecodeError:
            # Fallback to regex extraction
            import re
            metadata["result_text"] = output[:2000]
            cost_match = re.search(r'"total_cost_usd":([0-9.]+)', output)
            if cost_match:
                metadata["cost"] = cost_match.group(1)
            subtype_match = re.search(r'"subtype":"([^"]*)"', output)
            if subtype_match:
                metadata["subtype"] = subtype_match.group(1)

        return metadata


# === Error Detection ===

class ErrorDetector:
    @staticmethod
    def is_usage_limit(output: str) -> bool:
        """Check if output indicates API usage limit"""
        keywords = ["usage limit", "rate limit", "too many requests",
                    "resource_exhausted", "overloaded"]
        return any(kw in output.lower() for kw in keywords)


# === Main Loop ===

class AutoLoop:
    def __init__(self, config: Config):
        self.config = config
        self.logger = Logger(config.log_dir, to_console=True)
        self.state = StateManager(config)
        self.consensus = ConsensusManager(config, self.logger)
        self.rotator = LogRotator(config, self.logger)
        self.runner = ClaudeRunner(config, self.logger)

        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

        # Create directories
        self.config.log_dir.mkdir(parents=True, exist_ok=True)
        self.config.memories_dir.mkdir(parents=True, exist_ok=True)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.log("=== Auto Loop Shutting Down ===")
        self.config.running = False
        self.state.save("stopped")
        if self.config.pid_file.exists():
            self.config.pid_file.unlink()
        sys.exit(0)

    def check_stop_requested(self) -> bool:
        """Check if stop was requested"""
        if self.config.stop_file.exists():
            self.config.stop_file.unlink()
            return True
        return False

    def write_pid(self):
        """Write PID file"""
        with open(self.config.pid_file, "w") as f:
            f.write(str(os.getpid()))

    def run(self):
        """Main loop"""
        # Check for existing instance
        if self.config.pid_file.exists():
            try:
                with open(self.config.pid_file) as f:
                    pid = int(f.read().strip())
                # Try to send signal 0 to check if process exists
                os.kill(pid, 0)
                print(f"Auto loop already running (PID {pid}). Stop it first.")
                return
            except (OSError, ValueError):
                # Process not running, clean up stale PID
                self.config.pid_file.unlink()

        # Write PID file
        self.write_pid()

        # Clean up any stale stop file from previous runs
        if self.config.stop_file.exists():
            self.config.stop_file.unlink()

        # Load previous state
        self.state.load()

        self.logger.log(f"=== Auto Company Loop Started (PID {os.getpid()}) ===")
        self.logger.log(f"Project: {self.config.project_dir}")
        self.logger.log(f"Model: {self.config.model} | Interval: {self.config.loop_interval}s | "
                       f"Timeout: {self.config.cycle_timeout}s | Breaker: {self.config.max_errors} errors")

        self.state.save("running")

        # Main loop
        while self.config.running:
            # Check for stop request
            if self.check_stop_requested():
                self.logger.log("Stop requested. Shutting down gracefully.")
                self.signal_handler(None, None)
                return

            self.config.loop_count += 1

            # Log rotation
            self.rotator.rotate()

            # Backup consensus
            self.consensus.backup()

            try:
                # Build prompt
                full_prompt = self.consensus.get_full_prompt()

                # Run Claude cycle
                returncode, output, metadata = self.runner.run_cycle(full_prompt)

                # Analyze results
                cycle_failed = False
                failed_reason = ""

                if metadata.get("timed_out"):
                    cycle_failed = True
                    failed_reason = f"Timed out after {self.config.cycle_timeout}s"
                elif returncode != 0:
                    cycle_failed = True
                    failed_reason = f"Exit code {returncode}"
                elif metadata.get("subtype") != "success" and metadata.get("subtype"):
                    cycle_failed = True
                    failed_reason = f"Non-success subtype '{metadata['subtype']}'"
                elif not self.consensus.validate():
                    cycle_failed = True
                    failed_reason = "consensus.md validation failed after cycle"

                if cycle_failed:
                    self.config.error_count += 1
                    self.logger.log_cycle(self.config.loop_count, "FAIL",
                                        f"{failed_reason} (errors: {self.config.error_count}/{self.config.max_errors})")

                    # Restore consensus
                    self.consensus.restore()

                    # Check for usage limit
                    if ErrorDetector.is_usage_limit(output):
                        self.logger.log_cycle(self.config.loop_count, "LIMIT",
                                            f"API usage limit detected. Waiting {self.config.limit_wait}s...")
                        self.state.save("waiting_limit")
                        time.sleep(self.config.limit_wait)
                        self.config.error_count = 0
                        continue

                    # Circuit breaker
                    if self.config.error_count >= self.config.max_errors:
                        self.logger.log_cycle(self.config.loop_count, "BREAKER",
                                            f"Circuit breaker tripped! Cooling down {self.config.cooldown}s...")
                        self.state.save("circuit_break")
                        time.sleep(self.config.cooldown)
                        self.config.error_count = 0
                        self.logger.log("Circuit breaker reset. Resuming...")
                else:
                    cost = metadata.get("cost", "unknown")
                    result_text = metadata.get("result_text", "")
                    self.logger.log_cycle(self.config.loop_count, "OK", f"Completed (cost: ${cost})")
                    if result_text:
                        self.logger.log_cycle(self.config.loop_count, "SUMMARY", result_text[:300])
                    self.config.error_count = 0

            except Exception as e:
                self.config.error_count += 1
                self.logger.log_cycle(self.config.loop_count, "ERROR", str(e))
                self.consensus.restore()

            self.state.save("idle")
            self.logger.log_cycle(self.config.loop_count, "WAIT", f"Sleeping {self.config.loop_interval}s...")
            time.sleep(self.config.loop_interval)


def main():
    parser = argparse.ArgumentParser(description="Auto Company - 24/7 Autonomous Loop")
    parser.add_argument("--stop", action="store_true", help="Stop running loop")
    parser.add_argument("--status", action="store_true", help="Show status")
    parser.add_argument("--daemon", action="store_true", help="Run as daemon (Unix only)")

    args = parser.parse_args()
    config = Config()

    # Handle --stop
    if args.stop:
        if config.stop_file.exists():
            config.stop_file.unlink()
        config.stop_file.touch()
        print("Stop signal sent. Loop will stop after current cycle completes.")

        # Also try to kill the process if PID exists
        if config.pid_file.exists():
            with open(config.pid_file) as f:
                pid = int(f.read().strip())
            try:
                os.kill(pid, signal.SIGTERM)
                print(f"Sent SIGTERM to PID {pid}")
            except OSError:
                print(f"Process {pid} not running.")
                config.pid_file.unlink()
        return

    # Handle --status
    if args.status:
        print("=== Auto Company Status ===")
        if config.pid_file.exists():
            with open(config.pid_file) as f:
                pid = int(f.read().strip())
            try:
                os.kill(pid, 0)
                print(f"Loop: RUNNING (PID {pid})")
            except OSError:
                print(f"Loop: STOPPED (stale PID {pid})")
        else:
            print("Loop: NOT RUNNING")

        if config.state_file.exists():
            print()
            with open(config.state_file) as f:
                print(f.read())

        if config.consensus_file.exists():
            print("=== Latest Consensus ===")
            with open(config.consensus_file) as f:
                lines = f.readlines()
                print("".join(lines[:30]))

        if config.log_dir.exists():
            main_log = config.log_dir / "auto-loop.log"
            if main_log.exists():
                print("\n=== Recent Log ===")
                result = subprocess.run(["tail", "-20", str(main_log)],
                                       capture_output=True, text=True)
                print(result.stdout)
        return

    # Handle --daemon (Unix only)
    if args.daemon:
        if sys.platform == "win32":
            print("--daemon is not supported on Windows. Use Task Scheduler instead.")
            return

        # Double fork to detach
        try:
            pid = os.fork()
            if pid > 0:
                # Parent exit
                print(f"Daemon started with PID {pid}")
                return
        except OSError as e:
            print(f"Fork failed: {e}")
            return

        # Decouple from parent environment
        os.chdir("/")
        os.setsid()
        os.umask(0)

        # Second fork
        try:
            pid = os.fork()
            if pid > 0:
                return
        except OSError as e:
            print(f"Second fork failed: {e}")
            return

        # Redirect standard file descriptors
        sys.stdout.flush()
        sys.stderr.flush()
        with open(os.devnull, 'r') as si:
            os.dup2(si.fileno(), sys.stdin.fileno())
        with open(os.devnull, 'a+') as so:
            os.dup2(so.fileno(), sys.stdout.fileno())
        with open(os.devnull, 'a+') as se:
            os.dup2(se.fileno(), sys.stderr.fileno())

    # Run main loop
    loop = AutoLoop(config)
    loop.run()


if __name__ == "__main__":
    main()
