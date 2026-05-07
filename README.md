# nmapVibe

> ⚠️ **Security Warning**
> 
> This application is intended to be accessible by the **local host ONLY**. It is **never to be exposed to the public** or any external network under any circumstances.

---

## Table of Contents

- [Installation](#installation)
- [UI Options Reference](#ui-options-reference)
  - [Target Input](#target-input)
  - [Scan Types](#scan-types)
  - [Port Options](#port-options)
  - [Timing Templates](#timing-templates)
  - [Custom Arguments](#custom-arguments)
- [Limitations & Potential Issues](#limitations--potential-issues)
- [Results & Export](#results--export)
- [Credits](#credits)
- [Disclaimer](#disclaimer)

---

## Installation

Refer to [`n00b_notes.md`](n00b_notes.md) for detailed setup instructions, including:
- Installing system dependencies (`python3-venv`, `python3-pip`, `nmap`)
- Creating and activating a Python virtual environment
- Installing project dependencies (`flask`)
- Running the application

---

## UI Options Reference

### Target Input
**Field:** IP address or CIDR notation  
**Format:** `192.168.1.1` or `192.168.1.0/24`  
**Limitation:** Hostnames (e.g., `google.com`) are NOT supported  
**Validation:** Basic IP/CIDR format check on both frontend and backend  

---

### Scan Types

#### `-sS` TCP SYN Scan (Default)
- **What it does:** Stealth scan that sends SYN packets and analyzes responses  
- **Speed:** Fast  
- **Privileges:** Requires root (`sudo`)  
- **Use case:** Default scan for most situations  

#### `-sU` UDP Scan
- **What it does:** Scans for open UDP ports  
- **Speed:** Very slow (UDP is connectionless)  
- **Privileges:** Requires root  
- **Downfall:** Can take 10-100x longer than TCP scans  

#### `-sV` Version Detection
- **What it does:** Probes open ports to determine service/version info  
- **Speed:** Moderate slowdown  
- **Use case:** Identify what services are running (Apache, OpenSSH, etc.)  

#### `-O` OS Detection
- **What it does:** Attempts to identify the target's operating system  
- **Privileges:** Requires root  
- **Accuracy:** Not always reliable; may show "Too many fingerprints" error  
- **Downfall:** Aggressive, can be detected by IDS  

#### `-A` Aggressive Scan
- **What it does:** Enables OS detection, version detection, script scanning, and traceroute  
- **Privileges:** Requires root  
- **Speed:** Slow and noisy  
- **Downfall:** Very detectable, leaves obvious audit trails, may trigger security alerts  

#### `-sn` Ping Scan (Host Discovery Only)
- **What it does:** Discovers live hosts without scanning ports  
- **Output:** Shows only which hosts respond to ping  
- **Use case:** Network mapping, finding active devices  
- **Note:** Port columns hidden in results view  

---

### Port Options

#### Common Ports (Default)
- **What it does:** Scans standard ports (nmap default ~1000 ports)  
- **Speed:** Fast  

#### All Ports (`-p-`)
- **What it does:** Scans all 65535 TCP ports  
- **Speed:** Very slow (can take 10+ minutes)  
- **Downfall:** Extremely noisy, easily detected  

#### Custom Range
- **What it does:** Scan specific ports (e.g., `80,443,8080` or `1-1000`)  
- **Format:** Comma-separated or hyphenated ranges  

---

### Timing Templates

| Template | Name     | Speed          | Stealth       | Detection Risk |
|----------|----------|----------------|---------------|----------------|
| `-T0`    | Paranoid | Extremely Slow | Very Stealthy | Minimal        |
| `-T1`    | Sneaky   | Very Slow      | Stealthy      | Low            |
| `-T2`    | Polite   | Slow           | Moderate      | Low            |
| `-T3`    | Normal   | Medium         | Standard      | Standard       |
| `-T4`    | Aggressive | Fast         | None          | High           |
| `-T5`    | Insane   | Very Fast      | None          | Very High      |

**Downfall:** Higher timing = more likely to be blocked by firewalls or trigger IDS  

---

### Custom Arguments
- **What it does:** Pass additional nmap flags directly  
- **Example:** `--script vuln` for vulnerability scripts  
- **⚠️ Warning:** Incorrect flags can break the scan or cause unexpected behavior  
- **Downfall:** No validation on custom arguments  

---

## Limitations & Potential Issues

1. **Scan Timeout:** All scans have a 5-minute maximum duration  
2. **Root Requirements:** Many scan types (`-sS`, `-sU`, `-O`, `-A`) require running Flask with `sudo`  
3. **No Hostname Resolution:** Must use IP addresses, not domain names  
4. **Local Only:** Binds to `127.0.0.1` only (by design)  
5. **Ping Scan Disable Conflict:** Selecting Ping Scan auto-disables other scan types (mutually exclusive)  
6. **Parse Errors:** If nmap output is malformed, results may not display  

---

## Results & Export

- **Summary Card:** Shows target, scan type, duration, hosts up  
- **Export JSON:** Downloads results as `nmap-results-{timestamp}.json`  
- **Color Coding:** Open=green, Closed=red, Filtered=yellow  

---

## Credits

All code in this repository was written by **opencode**.  
Project by **RabbidByte**.  

---

## Disclaimer

This project is for **educational purposes only**. Users are responsible for complying with applicable laws and regulations when using network scanning tools.
