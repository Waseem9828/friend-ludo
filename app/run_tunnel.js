const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');
const outFile = path.join(__dirname, 'tunnel_url.txt');

const child = spawn(cloudflaredPath, ['tunnel', '--url', 'http://127.0.0.1:5001'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let found = false;

function processOutput(data) {
  const text = data.toString();
  process.stdout.write(text);

  const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.trycloudflare\.com/);
  if (match && !found) {
    found = true;
    const url = match[0];
    console.log('\n=======================================================');
    console.log(`🌐 Public Live Tunnel URL: ${url}`);
    console.log('=======================================================\n');
    fs.writeFileSync(outFile, url, 'utf8');
  }
}

child.stdout.on('data', processOutput);
child.stderr.on('data', processOutput);

child.on('exit', (code) => {
  console.log(`Tunnel process exited with code ${code}`);
});
