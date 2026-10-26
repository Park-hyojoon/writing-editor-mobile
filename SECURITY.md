# Security

This repository publishes the Writing Editor app and public dependency assets. User documents, photos, Google access tokens, passwords and PC paths must never be committed here. The browser OAuth client ID is a public application identifier, not a client secret.

GitHub secret scanning and push protection are enabled. Main branch force pushes and deletion are blocked. Actions use read-only default permissions and approved GitHub-owned actions. A scheduled security check validates the public file list, credential patterns, app asset integrity and recorded npm dependency versions. Dependency alerts supplement these checks; a compiled app must be rebuilt to apply a dependency update.

Please use this repository's private vulnerability reporting feature for security reports. Do not post personal documents, screenshots containing account data, passwords or access tokens in public issues.

App text is stored in the device browser. Optional Google Drive sync requests only appDataFolder access, with short-lived tokens kept in memory. Images/PDFs remain in device storage unless the user explicitly shares them. Data is not encrypted by the app with a separate user-held key. Device/account compromise, browser extensions and future vulnerabilities remain outside the scope of a single source review. No audit guarantees absolute safety.

The GitHub Pages host does not support app-controlled response headers such as frame-ancestors. The app refuses to render in an embedded frame, while its HTML CSP and asset integrity checks add protection. The PC server applies response headers and accepts loopback requests only.
