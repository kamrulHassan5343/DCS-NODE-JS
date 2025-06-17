// services/DcsInsurancePremiumCalculationService.js
const AuthService = require('./AuthService');

class DcsInsurancePremiumCalculationService {
  constructor() {
    this.authService = new AuthService();
    this.apiUrl = 'https://bracapitesting.brac.net/dcs/v2/loan/insurance-premium-calculator';
  }

  async calculate(requestData) {
    try {
      // 1. Get fresh token
      const token = await this.authService.getToken();
      
      // 2. Prepare request
      const payload = {
        branchCode: requestData.branchCode,
        projectCode: requestData.projectCode,
        loanProductCode: requestData.loanProductCode,
        policyType: requestData.policyType,
        proposalDurationInMonths: requestData.proposalDurationInMonths,
        proposedLoanAmount: requestData.proposedLoanAmount,
        insuranceProductId: requestData.insuranceProductId,
        memberDateOfBirth: requestData.memberDob,
        insurerDateOfBirth: requestData.insurerDob
      };

      // 3. Make API call
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
      
    } catch (error) {
      // Handle errors
      if (error.response?.status === 401) {
        // Token expired - clear cache and retry once
        this.authService.tokenCache = null;
        return this.calculate(requestData);
      }
      throw error;
    }
  }
}