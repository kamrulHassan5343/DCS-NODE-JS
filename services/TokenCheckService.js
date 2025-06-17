const axios = require('axios');
const qs = require('querystring');

class TokenDiagnosticsService {
    constructor() {
        this.clientId = 'Ieg1N5W2qh3hF0qS9Zh2wq6eex2DB935';
        this.clientSecret = '4H2QJ89kYQBStaCuY73h';
        this.baseUrl = 'https://bracapitesting.brac.net';
        this.fallbackToken = '7f30f4491cb4435984616d1913e88389';
    }

    async runCompleteDiagnostics() {
        console.log("🔍 COMPLETE BRAC API DIAGNOSTICS");
        console.log("=" + "=".repeat(50));
        console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Base URL: ${this.baseUrl}`);
        console.log();

        // Step 1: Network connectivity
        await this.checkNetworkConnectivity();
        console.log();

        // Step 2: Endpoint discovery
        await this.discoverEndpoints();
        console.log();

        // Step 3: Authentication methods
        await this.testAllAuthMethods();
        console.log();

        // Step 4: Test fallback token
        await this.testFallbackToken();
        console.log();

        // Step 5: API endpoint testing
        await this.testAPIEndpoints();
        console.log();

        // Step 6: Generate manual test commands
        this.generateManualTestCommands();
        console.log();

        // Step 7: Provide troubleshooting recommendations
        this.provideTroubleshootingRecommendations();
    }

    async checkNetworkConnectivity() {
        console.log("🌐 STEP 1: NETWORK CONNECTIVITY CHECK");
        console.log("-".repeat(40));

        const targets = [
            this.baseUrl,
            `${this.baseUrl}/health`,
            `${this.baseUrl}/status`,
            'https://httpbin.org/get', // External test
        ];

        for (const target of targets) {
            try {
                console.log(`📡 Testing: ${target}`);
                const startTime = Date.now();
                
                const response = await axios.get(target, {
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                const duration = Date.now() - startTime;
                console.log(`   ✅ Status: ${response.status} | Time: ${duration}ms`);
                
                if (response.headers['server']) {
                    console.log(`   🖥️  Server: ${response.headers['server']}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.code || error.message}`);
                
                if (error.code === 'ENOTFOUND') {
                    console.log("   🚨 DNS resolution failed - check domain name");
                } else if (error.code === 'ECONNREFUSED') {
                    console.log("   🚨 Connection refused - server might be down");
                } else if (error.code === 'ETIMEDOUT') {
                    console.log("   🚨 Connection timeout - network or firewall issue");
                }
            }
        }
    }

    async discoverEndpoints() {
        console.log("🔍 STEP 2: ENDPOINT DISCOVERY");
        console.log("-".repeat(40));

        const commonPaths = [
            '/auth',
            '/auth/token',
            '/oauth',
            '/oauth/token',
            '/api',
            '/api/auth',
            '/api/token',
            '/login',
            '/dcs',
            '/dcs/auth',
            '/dcs/v1',
            '/dcs/v2',
            '/dcs/v2/auth',
            '/.well-known/oauth-authorization-server'
        ];

        for (const path of commonPaths) {
            try {
                const url = `${this.baseUrl}${path}`;
                console.log(`🔎 Checking: ${url}`);
                
                const response = await axios.get(url, {
                    timeout: 5000,
                    validateStatus: () => true
                });

                if (response.status === 200) {
                    console.log(`   ✅ Found: ${response.status}`);
                    if (response.data && typeof response.data === 'object') {
                        console.log(`   📄 Content: ${JSON.stringify(response.data).substring(0, 100)}...`);
                    }
                } else if (response.status === 401) {
                    console.log(`   🔐 Auth required: ${response.status}`);
                } else if (response.status === 403) {
                    console.log(`   🚫 Forbidden: ${response.status}`);
                } else if (response.status === 404) {
                    console.log(`   ❌ Not found: ${response.status}`);
                } else {
                    console.log(`   ℹ️  Status: ${response.status}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
    }

    async testAllAuthMethods() {
        console.log("🔑 STEP 3: AUTHENTICATION METHODS TESTING");
        console.log("-".repeat(40));

        const authMethods = [
            {
                name: "OAuth2 Standard (Form-encoded)",
                url: `${this.baseUrl}/oauth/token`,
                method: 'POST',
                data: qs.stringify({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            },
            {
                name: "OAuth2 with Basic Auth",
                url: `${this.baseUrl}/oauth/token`,
                method: 'POST',
                data: qs.stringify({
                    grant_type: 'client_credentials'
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                    'Accept': 'application/json'
                }
            },
            {
                name: "Custom Auth Endpoint (JSON)",
                url: `${this.baseUrl}/auth/token`,
                method: 'POST',
                data: {
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    grant_type: 'client_credentials'
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            },
            {
                name: "Custom Auth Endpoint (Form)",
                url: `${this.baseUrl}/auth/token`,
                method: 'POST',
                data: qs.stringify({
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    grant_type: 'client_credentials'
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            },
            {
                name: "Login Endpoint",
                url: `${this.baseUrl}/auth/login`,
                method: 'POST',
                data: {
                    username: this.clientId,
                    password: this.clientSecret
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            },
            {
                name: "DCS Specific Auth",
                url: `${this.baseUrl}/dcs/auth/token`,
                method: 'POST',
                data: {
                    clientId: this.clientId,
                    clientSecret: this.clientSecret
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        ];

        for (let i = 0; i < authMethods.length; i++) {
            const method = authMethods[i];
            console.log(`\n🧪 Testing Method ${i + 1}: ${method.name}`);
            console.log(`📍 URL: ${method.url}`);

            try {
                const response = await axios({
                    method: method.method,
                    url: method.url,
                    data: method.data,
                    headers: method.headers,
                    timeout: 15000,
                    validateStatus: () => true
                });

                console.log(`📊 Status: ${response.status}`);
                console.log(`📋 Response Headers: ${JSON.stringify(response.headers, null, 2)}`);
                console.log(`📄 Response Data: ${JSON.stringify(response.data, null, 2)}`);

                if (response.status === 200 && response.data) {
                    // Check for token in response
                    const tokenFields = ['access_token', 'token', 'accessToken', 'authToken', 'bearerToken'];
                    let foundToken = false;

                    for (const field of tokenFields) {
                        if (response.data[field]) {
                            console.log(`🎉 SUCCESS! Token found in field: ${field}`);
                            console.log(`🔑 Token: ${response.data[field].substring(0, 20)}...`);
                            foundToken = true;
                            
                            // Test this token immediately
                            await this.testTokenAgainstAPI(response.data[field]);
                            break;
                        }
                    }

                    if (!foundToken) {
                        console.log("⚠️ Response successful but no token found");
                        console.log("Available fields:", Object.keys(response.data));
                    }
                } else {
                    console.log(`❌ Failed - Status: ${response.status}`);
                    this.analyzeErrorResponse(response);
                }

            } catch (error) {
                console.log(`❌ Request failed: ${error.message}`);
                if (error.response) {
                    console.log(`📊 Error Status: ${error.response.status}`);
                    console.log(`📄 Error Data: ${JSON.stringify(error.response.data, null, 2)}`);
                    this.analyzeErrorResponse(error.response);
                }
            }
        }
    }

    async testFallbackToken() {
        console.log("🔄 STEP 4: FALLBACK TOKEN TESTING");
        console.log("-".repeat(40));

        console.log(`🔑 Testing fallback token: ${this.fallbackToken.substring(0, 10)}...`);
        await this.testTokenAgainstAPI(this.fallbackToken);
        console.log(`✅ Fallback token test completed`);
    }
  }