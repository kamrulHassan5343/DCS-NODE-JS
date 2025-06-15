const axios = require('axios');

class VOService {
    ChanelLogStart(branchCode, pin, url) {
        console.log(`🔵 Log Start: BranchCode=${branchCode}, PIN=${pin}, URL=${url}`);
    }

    ChanelLogEnd(branchCode, pin, url) {
        console.log(`🔴 Log End: BranchCode=${branchCode}, PIN=${pin}, URL=${url}`);
    }

    async getVOListModified(BranchCode, cono, projectcode, br_date, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url) {
        try {
            console.log(`Making VO List API call for CO: ${cono}`);
            this.ChanelLogStart(BranchCode, PIN, _url);

            const apiParams = {
                BranchCode,
                cono,
                projectcode,
                br_date,
                LastSyncTime,
                securitykey,
                PIN,
                EndcurrentTimes
            };

            console.log(`VO API Params for ${cono}:`, apiParams);

            const response = await axios.post(_url, apiParams, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            this.ChanelLogEnd(BranchCode, PIN, _url);

            console.log(`VO API Response for ${cono}:`, {
                status: response.status,
                dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : 'not array') : 'no data'
            });

            return {
                cono,
                data: response.data,
                status: response.status,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error getting VO list for CO ${cono}:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });

            this.ChanelLogEnd(BranchCode, PIN, _url);

            return {
                cono,
                error: true,
                message: error.message,
                status: error.response?.status || 'network_error',
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new VOService();
