const SavingsTransactionService = require('../services/SavingsTransactionService');

class SavingsTransactionController {
  static async Savings_Transaction(req, res) {
    try {
      console.log('🔍 Incoming request query:', req.query);

      const result = await SavingsTransactionService.savings_transaction(req);

      // Handle different response types like Laravel does
      if (typeof result === 'string') {
        // If it's a JSON string, parse it to get status info
        try {
          const parsed = JSON.parse(result);
          if (parsed.status === 'E') {
            return res.status(400).json(parsed);
          } else if (parsed.status === 'CUSTMSG') {
            return res.status(500).json(parsed);
          } else {
            return res.status(200).send(result);
          }
        } catch (parseError) {
          // If it's not JSON, send as is (raw API response)
          return res.status(200).send(result);
        }
      } else if (result && typeof result === 'object') {
        // Handle object responses
        if (result.status === 'E') {
          const statusCode = parseInt(result.code) || 400;
          return res.status(statusCode).json(result);
        } else {
          // Successful response or raw API data
          return res.status(200).json(result);
        }
      } else {
        // Fallback for unexpected response types
        return res.status(200).json(result);
      }

    } catch (error) {
      console.error('❌ Error in Savings_Transaction:', error);
      return res.status(500).json({
        status: 'E',
        message: [{ message: 'Internal Server Error' }],
        code: '500'
      });
    }
  }
}

module.exports = SavingsTransactionController;