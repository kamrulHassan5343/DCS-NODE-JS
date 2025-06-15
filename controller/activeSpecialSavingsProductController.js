const catchAsync = require("../utils/catchAsync"); 
const axios = require('axios'); 

class ActiveSpecialSavingsProductController { 
  ChanelLogStart(branchCode, conNo, url) { 
    console.log(`[${new Date().toISOString()}] LOG START - Branch: ${branchCode}, CONo: ${conNo}, URL: ${url}`); 
  } 

  ChanelLogEnd(branchCode, conNo, url) { 
    console.log(`[${new Date().toISOString()}] LOG END - Branch: ${branchCode}, CONo: ${conNo}, URL: ${url}`); 
  } 

  async getActiveSpecialProduct({ 
    BranchCode, 
    ProjectCode, 
    LastSyncTime, 
    securitykey, 
    baseUrl, 
    caller, 
    AppId, 
    AppVersionCode, 
    AppVersionName 
  }) { 
    const currentTimes = new Date().toISOString().replace('T', ' ').substring(0, 19); 
    const status = 'ActiveSpecialSavingsProducts IN-' + caller; 

    console.log(`🔄 Sync Start → BranchCode: ${BranchCode}, PIN: ${caller}, Status: ${status}, Time: ${currentTimes}`); 

    let url = `${baseUrl}ActiveSpecialSavingsProducts?BranchCode=${BranchCode}&ProjectCode=${ProjectCode}&UpdatedAt=${LastSyncTime}&key=${securitykey}&caller=${caller}&EndDateTime=${LastSyncTime}`; 
    url = url.replace(/ /g, '%20'); 

    this.ChanelLogStart(BranchCode, caller, url); 

    try { 
      const response = await axios.get(url, { 
        headers: { 
          'Accept': 'application/json' 
        }, 
        timeout: 30000 
      }); 

      const json = response.data; 
      let result = []; 

      if (json && json.data && json.data.length > 0) { 
        result = json.data; 
      } 

      return result; 

    } catch (error) { 
      console.error(`❌ Error fetching data for ${caller}:`, error.message); 
      return null; 
    } finally { 
      this.ChanelLogEnd(BranchCode, caller, url); 
      const endTime = new Date().toISOString(); 
      console.log(`✅ ActiveSpecialSavingsProducts OUT-${caller} at ${endTime}`); 
    } 
  } 
} 

const getActiveSpecialProduct = catchAsync(async (req, res, next) => { 


  res.send("Hello from ActiveSpecialSavingsProductController!");

}); 

module.exports = { 
  getActiveSpecialProduct 
};