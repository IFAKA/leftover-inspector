# Security

Leftover Inspector treats every discovered path, filename, plist, and package record as untrusted input. Scans are read-only. Cleanup validates absolute paths, rejects traversal and protected resources, never follows symlinks, uses argument arrays for external commands, and stops on the first failed move. Credentials, SSH keys, browser profiles, databases, system paths, and shared directories are protected by default. Please report vulnerabilities privately through the repository security channel.
