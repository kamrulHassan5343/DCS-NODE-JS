

class ServerURLService {
  static async server_url() {
    // Return mocked or fixed URLs for now
    const url1 = "https://bracapitesting.brac.net/dcs/v2/loan/insurance-premium-calculator";
    const url2 = ""; // Optional fallback or secondary URL
    return [url1, url2];
  }
}

module.exports = ServerURLService;
