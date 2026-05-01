let lastResults = null;
let lastTarget = '';

document.addEventListener('DOMContentLoaded', () => {
    checkNmapInstalled();
    setupEventListeners();
});

async function checkNmapInstalled() {
    try {
        const response = await fetch('/api/check-nmap');
        const data = await response.json();
        
        if (!data.installed) {
            showError('nmap is not installed. Please install it with: sudo apt install nmap');
            document.getElementById('runScan').disabled = true;
        }
    } catch (err) {
        console.error('Failed to check nmap:', err);
    }
}

function setupEventListeners() {
    document.getElementById('runScan').addEventListener('click', runScan);
    document.getElementById('exportBtn').addEventListener('click', exportResults);
    
    document.querySelectorAll('input[name="portOption"]').forEach(radio => {
        radio.addEventListener('change', handlePortOptionChange);
    });
}

function handlePortOptionChange(e) {
    const portRangeGroup = document.getElementById('portRangeGroup');
    portRangeGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
}

function buildNmapCommand(target, options) {
    let cmd = ['nmap'];
    
    if (options.synScan) cmd.push('-sS');
    if (options.udpScan) cmd.push('-sU');
    if (options.versionDetect) cmd.push('-sV');
    if (options.osDetect) cmd.push('-O');
    if (options.aggressive) cmd.push('-A');
    
    if (options.allPorts) {
        cmd.push('-p-');
    } else if (options.portRange) {
        cmd.push('-p', options.portRange);
    }
    
    cmd.push(`-T${options.timing}`);
    cmd.push('-oX');
    cmd.push('-');
    cmd.push(target);
    
    if (options.customArgs) {
        cmd.push(...options.customArgs.split());
    }
    
    return cmd.join(' ');
}

async function runScan() {
    const target = document.getElementById('target').value.trim();
    const targetError = document.getElementById('target-error');
    
    targetError.textContent = '';
    lastTarget = target;
    
    if (!target) {
        targetError.textContent = 'Target is required';
        return;
    }
    
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipPattern.test(target)) {
        targetError.textContent = 'Invalid IP address or CIDR format';
        return;
    }
    
    const options = {
        synScan: document.getElementById('synScan').checked,
        udpScan: document.getElementById('udpScan').checked,
        versionDetect: document.getElementById('versionDetect').checked,
        osDetect: document.getElementById('osDetect').checked,
        aggressive: document.getElementById('aggressive').checked,
        allPorts: document.querySelector('input[name="portOption"]:checked').value === 'all',
        portRange: document.querySelector('input[name="portOption"]:checked').value === 'custom' 
            ? document.getElementById('portRange').value 
            : '',
        timing: document.getElementById('timing').value,
        customArgs: document.getElementById('customArgs').value
    };
    
    const cmd = buildNmapCommand(target, options);
    
    if (!confirm(`Are you sure you want to run this command?\n\n${cmd}\n\nTarget: ${target}`)) {
        return;
    }
    
    setStatus('running', 'Scanning in progress...');
    showLoading(true);
    hideResults();
    hideError();
    
    const scanBtn = document.getElementById('runScan');
    scanBtn.disabled = true;
    
    try {
        const response = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, options })
        });
        
        const data = await response.json();
        
        if (data.success) {
            lastResults = data.results;
            displayResults(data.results);
            setStatus('success', 'Scan complete');
        } else {
            showError(data.error || 'Scan failed');
            setStatus('error', 'Scan failed');
        }
    } catch (err) {
        showError('Failed to connect to server');
        setStatus('error', 'Connection error');
    } finally {
        showLoading(false);
        scanBtn.disabled = false;
    }
}

function displayResults(results) {
    const summaryCard = document.getElementById('scanSummary');
    const resultsTable = document.getElementById('resultsTable');
    const noResults = document.getElementById('noResults');
    const exportBtn = document.getElementById('exportBtn');
    
    summaryCard.style.display = 'grid';
    resultsTable.style.display = 'block';
    exportBtn.style.display = 'flex';
    
    const runstats = results.runstats || {};
    const allHosts = results.hosts || [];
    const hosts = allHosts.filter(h => h.status === 'up');
    const scaninfo = results.scaninfo || {};
    
    document.getElementById('summaryTarget').textContent = lastTarget || '-';
    
    document.getElementById('summaryType').textContent = scaninfo.type || '-';
    
    document.getElementById('summaryDuration').textContent = runstats.finished?.elapsed 
        ? `${parseFloat(runstats.finished.elapsed).toFixed(2)}s`
        : '-';
    
    document.getElementById('summaryHostsUp').textContent = runstats.hosts?.up || '0';
    
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    
    let openPorts = 0;
    let hasHosts = false;
    
    hosts.forEach(host => {
        hasHosts = true;
        const hostIp = host.addresses.find(a => a.addrtype === 'ipv4')?.addr || host.addresses[0]?.addr || '-';
        
        if (host.ports.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="host-cell">${hostIp}</td>
                <td>-</td>
                <td>-</td>
                <td class="state-up">up</td>
                <td>-</td>
                <td>-</td>
            `;
            tbody.appendChild(tr);
        } else {
            host.ports.forEach(port => {
                if (port.state === 'open') openPorts++;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="host-cell">${hostIp}</td>
                    <td class="port-cell">${port.portid}</td>
                    <td>${port.protocol}</td>
                    <td class="state-${port.state}">${port.state}</td>
                    <td>${port.service?.name || '-'}</td>
                    <td>${port.service?.product || ''} ${port.service?.version || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    });
    
    if (!hasHosts) {
        resultsTable.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        resultsTable.style.display = 'block';
        noResults.style.display = 'none';
    }
}

function exportResults() {
    if (!lastResults) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `nmap-results-${timestamp}.json`;
    
    const dataStr = JSON.stringify(lastResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function setStatus(type, text) {
    const statusEl = document.getElementById('statusIndicator');
    statusEl.className = `status ${type}`;
    statusEl.querySelector('.status-text').textContent = text;
}

function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'block' : 'none';
}

function hideResults() {
    document.getElementById('scanSummary').style.display = 'none';
    document.getElementById('resultsTable').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
    document.getElementById('exportBtn').style.display = 'none';
    lastResults = null;
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}
