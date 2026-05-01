import subprocess
import re
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


def check_nmap():
    try:
        result = subprocess.run(['nmap', '--version'], capture_output=True, text=True)
        match = re.search(r'Nmap version (\d+\.\d+)', result.stdout)
        if match:
            return True, match.group(1)
        return True, 'unknown'
    except FileNotFoundError:
        return False, None


def parse_nmap_xml(xml_output):
    import xml.etree.ElementTree as ET
    
    try:
        root = ET.fromstring(xml_output)
    except ET.ParseError:
        return None
    
    result = {
        'scaninfo': {},
        'hosts': [],
        'runstats': {}
    }
    
    # Parse scaninfo
    scaninfo = root.find('scaninfo')
    if scaninfo is not None:
        result['scaninfo'] = {
            'type': scaninfo.get('type'),
            'protocol': scaninfo.get('protocol'),
            'numservices': scaninfo.get('numservices'),
            'services': scaninfo.get('services', '')
        }
    
    # Parse hosts
    for host in root.findall('.//host'):
        host_data = {
            'status': host.find('status').get('state') if host.find('status') is not None else 'unknown',
            'addresses': [],
            'hostnames': [],
            'ports': []
        }
        
        # Addresses
        for addr in host.findall('address'):
            host_data['addresses'].append({
                'addr': addr.get('addr'),
                'addrtype': addr.get('addrtype')
            })
        
        # Hostnames
        for hostname in host.findall('.//hostname'):
            host_data['hostnames'].append({
                'name': hostname.get('name'),
                'type': hostname.get('type')
            })
        
        # Ports
        for port in host.findall('.//port'):
            port_data = {
                'portid': port.get('portid'),
                'protocol': port.get('protocol'),
                'state': port.find('state').get('state') if port.find('state') is not None else 'unknown',
                'service': None
            }
            
            service = port.find('service')
            if service is not None:
                port_data['service'] = {
                    'name': service.get('name'),
                    'product': service.get('product'),
                    'version': service.get('version'),
                    'extrainfo': service.get('extrainfo'),
                    'ostype': service.get('ostype')
                }
            
            host_data['ports'].append(port_data)
        
        result['hosts'].append(host_data)
    
    # Parse runstats
    runstats = root.find('runstats')
    if runstats is not None:
        finished = runstats.find('finished')
        if finished is not None:
            result['runstats'] = {
                'finished': {
                    'time': finished.get('time'),
                    'timestr': finished.get('timestr'),
                    'elapsed': finished.get('elapsed'),
                    'summary': finished.get('summary'),
                    'exit': finished.get('exit')
                }
            }
        
        hosts = runstats.find('hosts')
        if hosts is not None:
            result['runstats']['hosts'] = {
                'up': hosts.get('up'),
                'down': hosts.get('down'),
                'total': hosts.get('total')
            }
    
    return result


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/check-nmap', methods=['GET'])
def _check_nmap():
    installed, version = check_nmap()
    return jsonify({'installed': installed, 'version': version})


@app.route('/api/scan', methods=['POST'])
def api_scan():
    data = request.get_json()
    target = data.get('target', '').strip()
    options = data.get('options', {})
    
    if not target:
        return jsonify({'success': False, 'error': 'Target is required'}), 400
    
    # Basic validation - only allow IP addresses and CIDR notation
    ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}(/\d{1,2})?$'
    if not re.match(ip_pattern, target):
        return jsonify({'success': False, 'error': 'Invalid IP address or CIDR format'}), 400
    
    # Build nmap command
    cmd = ['nmap']
    
# Scan types
    
    # Port options
    if options.get('allPorts'):
        cmd.append('-p-')
    elif options.get('portRange'):
        port_range = options.get('portRange', '').strip()
        if port_range:
            cmd.extend(['-p', port_range])
    
    # Timing
    timing = options.get('timing', '3')
    cmd.append(f'-T{timing}')
    
    # Output in XML format for parsing
    cmd.append('-oX')
    cmd.append('-')
    
    # Add target
    cmd.append(target)
    
    # Add any custom arguments
    custom_args = options.get('customArgs', '').strip()
    if custom_args:
        cmd.extend(custom_args.split())
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        # Check return code (0 = success, 1 = some hosts down but valid)
        if result.returncode != 0 and result.returncode != 1:
            error_msg = result.stderr or 'Unknown error occurred'
            return jsonify({'success': False, 'error': error_msg}), 500
        
        # Check if nmap produced any output
        if not result.stdout.strip():
            error_msg = result.stderr or 'No nmap output received'
            return jsonify({'success': False, 'error': error_msg}), 500
        
        # Parse XML output
        parsed = parse_nmap_xml(result.stdout)
        
        if parsed is None:
            return jsonify({'success': False, 'error': 'Failed to parse nmap output'}), 500
        
        return jsonify({
            'success': True,
            'results': parsed,
            'command': ' '.join(cmd)
        })
    
    except subprocess.TimeoutExpired:
        return jsonify({'success': False, 'error': 'Scan timed out (max 5 minutes)'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
