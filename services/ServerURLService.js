




class ServerURLService {
  static async server_url() {
    try {
      // This should be your actual API base URL
      const url1 = "https://bracapitesting.brac.net/node/scapir/";
      const url2 = "https://bracapitesting.brac.net/dcs/v1/"; // Optional fallback URL
      return [url1, url2];
    } catch (error) {
      console.error('Error in server_url:', error);
      return JSON.stringify({ status: "CUSTMSG", message: "Error getting server URL" });
    }
  }
}

module.exports = ServerURLService;