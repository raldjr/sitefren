"""Validate a versioned release and write its public notes/checksum into a staging directory.

Run: python3 scripts/release.py v0.1.10 /tmp/sitefren-release
No network calls, credentials, or application execution.
"""
import hashlib
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def prepare(tag, destination):
    if not re.fullmatch(r"v\d+\.\d+\.\d+", tag):
        raise ValueError("Use a release tag such as v0.1.10")
    version = tag[1:]
    source = (ROOT / "sitefren.php").read_text()
    if f"const PS_VERSION = '{version}';" not in source or f"Sitefren {version} —" not in source:
        raise ValueError("Release tag must match the PHP version and header")
    for name in ("README.md", "docs/INSTALLATION.md"):
        if f"Alpha {version}" not in (ROOT / name).read_text():
            raise ValueError(f"Update the version in {name}")
    expected_download = f"https://github.com/raldjr/sitefren/releases/download/{tag}/sitefren.php"
    if expected_download not in (ROOT / "README.md").read_text():
        raise ValueError("README must link to this release's standalone download")

    tracked = set(subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().strip("\0").split("\0"))
    for name in tracked:
        if re.search(r"(^|/)(builder-state[^/]*|\.env(?:\..*)?|id_rsa|id_ed25519)$", name):
            raise ValueError(f"Private runtime or credential file in release: {name}")
    manifest = {}
    for line in (ROOT / "SHA256SUMS").read_text().splitlines():
        digest, name = line.split("  ", 1)
        if name in manifest or not re.fullmatch(r"[a-f0-9]{64}", digest):
            raise ValueError("Malformed or duplicate checksum entry")
        manifest[name] = digest
    if set(manifest) != tracked - {"SHA256SUMS"}:
        raise ValueError("SHA256SUMS must cover every tracked file except itself")
    for name, digest in manifest.items():
        if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != digest:
            raise ValueError(f"Stale checksum: {name}")

    changelog = (ROOT / "CHANGELOG.md").read_text()
    match = re.search(r"^## " + re.escape(version) + r" — [^\n]+\n(.*?)(?=^## |\Z)", changelog, re.M | re.S)
    if not match or not match[1].strip():
        raise ValueError("Add release notes to CHANGELOG.md")
    notes = match[1].strip() + "\n\n"
    notes += (
        "### Install or upgrade\n\n"
        f"Download [sitefren.php]({expected_download}) below and upload only that file. "
        "For upgrades, back up private state and published files first, then replace the editor. "
        "Keep `builder-state.php` and your website files. No setup reset is needed.\n\n"
        "The editor remains alpha. In-place updating is not implemented. Existing versions "
        "with release checking can discover this release during use, or through Settings → Check for updates.\n\n"
        "The attached checksums cover the standalone download and the source tree. "
        "Source archives are provided by GitHub. See VALIDATION.md in the source for test evidence "
        "and remaining hosting/live-provider limitations.\n"
    )
    destination = pathlib.Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "notes.md").write_text(notes)
    (destination / "sitefren.php.sha256").write_text(manifest["sitefren.php"] + "  sitefren.php\n")
    print(f"Verified {tag}: {len(manifest)} files; release notes and download checksum ready.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python3 scripts/release.py TAG STAGING_DIRECTORY")
    try:
        prepare(sys.argv[1], sys.argv[2])
    except (ValueError, OSError) as error:
        raise SystemExit(str(error)) from error
