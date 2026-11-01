import {randomBytes,scryptSync} from 'node:crypto';
import {stdin,stdout} from 'node:process';
if(!stdin.isTTY) { console.error('Run in an interactive terminal.');process.exit(1); }
stdout.write('New admin password (12+ characters, hidden): ');stdin.setRawMode(true);stdin.resume();stdin.setEncoding('utf8');let password='';
stdin.on('data',chunk=>{for(const c of chunk){if(c==='\u0003'){stdin.setRawMode(false);process.exit(1);}if(c==='\r'||c==='\n'){stdin.setRawMode(false);stdin.pause();stdout.write('\n');if(password.length<12){console.error('Use at least 12 characters.');process.exit(1);}const salt=randomBytes(16).toString('hex');console.log('Set ADMIN_PASSWORD_HASH in Netlify (Functions scope) to:');console.log('scrypt:'+salt+':'+scryptSync(password,salt,64).toString('hex'));return;}if(c==='\u007f')password=password.slice(0,-1);else password+=c;}});
