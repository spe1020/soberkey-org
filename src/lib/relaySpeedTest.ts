/**
 * Relay Speed Test Utility
 * Tests response times of Nostr relays to determine optimal relay selection
 */

const TEST_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.snort.social',
  'wss://relay.nostr.bg',
  'wss://eden.nostr.land',
  'wss://nostr.fmt.wiz.biz',
  'wss://nostr.relays.earth',
  'wss://nostr.luvnr.com',
];

export interface RelaySpeedResult {
  relay: string;
  responseTime: number;
  success: boolean;
  error?: string;
}

/**
 * Test a single relay's response time
 */
async function testRelay(relayUrl: string): Promise<RelaySpeedResult> {
  const startTime = Date.now();
  
  try {
    const ws = new WebSocket(relayUrl);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve({
          relay: relayUrl,
          responseTime: 5000, // 5 second timeout
          success: false,
          error: 'Timeout',
        });
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        
        // Send a test query
        ws.send(JSON.stringify(['REQ', 'test', { kinds: [0], limit: 1 }]));
        
        // Wait for first response or timeout
        const responseTimeout = setTimeout(() => {
          ws.close();
          resolve({
            relay: relayUrl,
            responseTime,
            success: true,
          });
        }, 2000);
        
        ws.onmessage = () => {
          clearTimeout(responseTimeout);
          ws.close();
          resolve({
            relay: relayUrl,
            responseTime,
            success: true,
          });
        };
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        resolve({
          relay: relayUrl,
          responseTime,
          success: false,
          error: 'Connection error',
        });
      };
    });
  } catch (error) {
    return {
      relay: relayUrl,
      responseTime: 5000,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test all relays and return results sorted by speed
 */
export async function testAllRelays(): Promise<RelaySpeedResult[]> {
  console.log('Testing relay speeds...');
  
  const results = await Promise.all(
    TEST_RELAYS.map(relay => testRelay(relay))
  );
  
  // Sort by response time (fastest first)
  const sorted = results.sort((a, b) => a.responseTime - b.responseTime);
  
  console.log('\nRelay Speed Test Results:');
  console.log('=========================');
  sorted.forEach((result, index) => {
    const status = result.success ? '✓' : '✗';
    const time = result.responseTime.toFixed(0).padStart(4);
    console.log(`${index + 1}. ${status} ${time}ms - ${result.relay}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  return sorted;
}

/**
 * Get the top N fastest relays
 */
export function getFastestRelays(results: RelaySpeedResult[], count: number = 6): string[] {
  return results
    .filter(result => result.success && result.responseTime < 5000)
    .slice(0, count)
    .map(result => result.relay);
}

/**
 * Run the speed test and update relay configuration
 */
export async function runSpeedTest(): Promise<void> {
  try {
    const results = await testAllRelays();
    const fastest = getFastestRelays(results, 6);
    
    console.log('\nRecommended Top Relays:');
    console.log('=======================');
    fastest.forEach((relay, index) => {
      console.log(`${index + 1}. ${relay}`);
    });
    
    // Log as exportable array
    console.log('\nCopy this to your code:');
    console.log('const RECOVERY_RELAYS = [');
    fastest.forEach(relay => console.log(`  '${relay}',`));
    console.log('];');
    
  } catch (error) {
    console.error('Speed test failed:', error);
  }
}

