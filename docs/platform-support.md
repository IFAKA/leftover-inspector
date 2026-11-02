# Platform support

macOS is the first complete discovery target. Linux scans XDG autostart, desktop and user-systemd records. Windows scans AppData, ProgramData, and Startup records. Linux and Windows mutation operations are intentionally unsupported. All adapters accept injected filesystem and command access, so tests never touch the host.
