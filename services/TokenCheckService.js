const axios = require('axios');

class TokenCheckService {
  constructor() {
    this.sessionData = {
      expirtime: null,
      expirdate: null,
      access_token: null
    };
  }

  static async check_token() {
    const instance = new TokenCheckService();
    return await instance.checkToken();
  }

  async checkToken() {
    try {
      let token = '';
      
      const currentHour = new Date().getHours();
      const currentDate = new Date().toISOString().split('T')[0];
      
      const storedTime = this.sessionData.expirtime || 0;
      const storedDate = this.sessionData.expirdate || '2000-01-01';
      
      let totalHours = currentHour - storedTime;
      
      if (currentDate !== storedDate) {
        totalHours = 1;
      }
      
      if (totalHours > 0 || !this.sessionData.access_token) {
        console.log('Token expired or missing, fetching new token...');
        
        this.sessionData.expirtime = currentHour;
        this.sessionData.expirdate = currentDate;
        
        const clientUrl = 'https://erp.brac.net/oauth/v2/token?grant_type=client_credentials';
        const headers = {
          'x-client-id': '1_43wc41hen7cwg0sg4s044c0scc8wck4o',
          'x-client-secret': '654spemp5qckcg4g448044kco4k0g8wwo0440osgwosggwg4',
          'Content-Type': 'application/x-www-form-urlencoded'
        };
        
        const response = await axios.post(clientUrl, '', {
          headers: headers,
          timeout: 10000
        });
        
        console.log('Token response:', response.data);
        
        if (response.data?.access_token) {
          this.sessionData.access_token = response.data.access_token;
          token = response.data.access_token;
        } else {
          console.error('No access token received');
          throw new Error('Failed to get access token from response');
        }
      } else {
        token = this.sessionData.access_token;
        console.log('Using existing token');
      }
      
      return token;
      
    } catch (error) {
      console.error('Error in token check:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      return '';
    }
  }
  
  clearToken() {
    this.sessionData = {
      expirtime: null,
      expirdate: null,
      access_token: null
    };
  }
}

module.exports = TokenCheckService;