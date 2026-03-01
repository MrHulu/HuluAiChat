#!/usr/bin/env python3
"""
Auto Company — Live Monitor (Cross-Platform)
============================================
Watch the auto-loop output in real-time.

Usage:
    python monitor.py            # Tail the main log
    python monitor.py --last     # Show last cycle's full output
    python monitor.py --status   # Show current loop status
    python monitor.py --cycles   # Summary of all cycles
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime


class Config:
    def __init__(self):
        self.project_dir = Path(__file__).parent.absolute()
        self.log_dir = self.project_dir / "logs"
        self.state_file = self.project_dir / ".auto-loop-state"
        self.pid_file = self.project_dir / ".auto-loop.pid"
        self.pause_file = self.project_dir / ".auto-loop-paused"
        self.consensus_file = self.project_dir / "memories" / "consensus.md"
        self.main_log = self.log_dir / "auto-loop.log"


def show_status():
    """Show current loop status"""
    print("=== Auto Company Status ===")

    # Check if loop is running
    if Config().pid_file.exists():
        with open(Config().pid_file) as f:
            pid = int(f.read().strip())
        try:
            os.kill(pid, 0)
            print(f"Loop: RUNNING (PID {pid})")
        except OSError:
            print(f"Loop: STOPPED (stale PID {pid})")
    else:
        print("Loop: NOT RUNNING")

    # Check pause state
    if Config().pause_file.exists():
        print("Daemon: PAUSED (.auto-loop-paused present)")
    else:
        print("Daemon: ACTIVE")

    # Show state
    if Config().state_file.exists():
        print()
        with open(Config().state_file) as f:
            print(f.read())

    # Show consensus header
    print("\n=== Latest Consensus ===")
    if Config().consensus_file.exists():
        with open(Config().consensus_file) as f:
            lines = f.readlines()
            print("".join(lines[:30]))
            if len(lines) > 30:
                print(f"\n... ({len(lines) - 30} more lines)")
    else:
        print("(no consensus file)")

    # Show recent log
    print("\n=== Recent Log ===")
    if Config().main_log.exists():
        try:
            result = subprocess.run(
                ["tail", "-20", str(Config().main_log)],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print(result.stdout)
            else:
                # Windows: use Python to read last lines
                with open(Config().main_log) as f:
                    lines = f.readlines()
                    print("".join(lines[-20:]))
        except FileNotFoundError:
            # Windows: use Python to read last lines
            with open(Config().main_log) as f:
                lines = f.readlines()
                print("".join(lines[-20:]))
    else:
        print("No log file yet.")


def show_last_cycle():
    """Show last cycle's full output"""
    cycle_logs = sorted(Config().log_dir.glob("cycle-*.log"),
                       key=lambda p: p.stat().st_mtime, reverse=True)

    if cycle_logs:
        latest = cycle_logs[0]
        print(f"=== Latest Cycle: {latest.name} ===")

        # Try to extract result from JSON
        try:
            with open(latest) as f:
                content = f.read()

            data = json.loads(content)
            if "result" in data:
                print(data["result"])
            else:
                print(content)
        except json.JSONDecodeError:
            print(content)
    else:
        print("No cycle logs found.")


def show_cycles():
    """Show cycle history summary"""
    print("=== Cycle History ===")

    if Config().main_log.exists():
        with open(Config().main_log) as f:
            lines = f.readlines()

        # Filter cycle lines
        import re
        cycle_lines = [l for l in lines if re.search(r'Cycle #\d+ \[(OK|FAIL|START|LIMIT|BREAKER)\]', l)]

        for line in cycle_lines[-50:]:
            print(line.rstrip())
    else:
        print("No log found.")


def tail_log():
    """Tail the main log in real-time"""
    print("=== Auto Company Live Monitor (Ctrl+C to stop) ===")
    print(f"Watching: {Config().main_log}")
    print()

    if not Config().main_log.exists():
        print("No log file yet. Start the loop first: python auto_loop.py")
        return

    # Seek to end of file
    with open(Config().main_log, "r", encoding="utf-8") as f:
        # Go to end
        f.seek(0, 2)
        file_size = f.tell()

        try:
            while True:
                line = f.readline()
                if not line:
                    # Wait for new content
                    import time
                    time.sleep(0.1)
                    # Check if file was rotated
                    current_size = f.tell()
                    if current_size < file_size:
                        f.seek(0, 2)
                        file_size = f.tell()
                    continue
                print(line.rstrip())
        except KeyboardInterrupt:
            print("\nMonitor stopped.")


def main():
    parser = argparse.ArgumentParser(description="Auto Company - Live Monitor")
    parser.add_argument("--last", action="store_true", help="Show last cycle's output")
    parser.add_argument("--status", action="store_true", help="Show loop status")
    parser.add_argument("--cycles", action="store_true", help="Show cycle history")

    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.last:
        show_last_cycle()
    elif args.cycles:
        show_cycles()
    else:
        tail_log()


if __name__ == "__main__":
    main()
