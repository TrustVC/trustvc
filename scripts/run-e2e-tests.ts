import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runE2ETests() {
  console.log('🚀 Starting E2E Test Setup...');

  try {
    // Run the E2E tests
    console.log('🧪 Running E2E tests...');
    await execAsync('npx hardhat test src/__tests__/e2e/**/*.test.ts --network hardhat');
    console.log('✅ E2E tests completed successfully');
  } catch (error) {
    console.error('❌ E2E test execution failed:', error);
    process.exit(1);
  }
}

async function startLocalNode() {
  console.log('🌐 Starting Hardhat local node...');

  try {
    const child = exec('npx hardhat node');

    child.stdout?.on('data', (data) => {
      console.log(data);
    });

    child.stderr?.on('data', (data) => {
      console.error(data);
    });

    child.on('close', (code) => {
      console.log(`Local node process exited with code ${code}`);
    });

    console.log('✅ Local node started successfully');
    console.log('🔗 Available at: http://127.0.0.1:8545');
    console.log('📋 Chain ID: 1337');
  } catch (error) {
    console.error('❌ Failed to start local node:', error);
    process.exit(1);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'node') {
  startLocalNode();
} else if (command === 'test') {
  runE2ETests();
} else {
  console.log('Usage:');
  console.log('  npm run e2e:node  - Start local Hardhat node');
  console.log('  npm run e2e:test  - Run E2E tests');
}
