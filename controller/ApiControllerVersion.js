const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config'); // Assuming you have this config file
const logger = require('../utils/logger'); // Assuming you have this logger utility

// Helper function to pad strings with zeros
// const padZero = (str, length) => {
//     return str.toString().padStart(length, '0');
// };

// // Helper function to validate token
// const validateToken = (token) => {
//     return token === '7f30f4491cb4435984616d1913e88389';
// };

// // Helper function to get server URL
// const getServerUrl = async (client, db) => {
//     try {
//         const query = `SELECT url, url2, server_url, maintenance_message, maintenance_status 
//                       FROM ${db}.server_url 
//                       WHERE server_status = 3 AND status = 1 
//                       LIMIT 1`;
        
//         const result = await client.query(query);
        
//         if (result.rows.length === 0) {
//             return {
//                 status: "CUSTMSG",
//                 message: "Server Api Not Found"
//             };
//         }
        
//         const serverData = result.rows[0];
        
//         if (serverData.maintenance_status === '1') {
//             return {
//                 status: "CUSTMSG",
//                 message: serverData.maintenance_message
//             };
//         }
        
//         return [serverData.url, serverData.url2, serverData.server_url];
//     } catch (error) {
//         logger.error('Error getting server URL:', error);
//         throw error;
//     }
// };

// // Helper function to make HTTP request
// const makeHttpRequest = async (url) => {
//     try {
//         const response = await axios.get(url, {
//             timeout: 30000,
//             headers: {
//                 'User-Agent': 'Node.js Application'
//             }
//         });
//         return response.data;
//     } catch (error) {
//         logger.error('HTTP request failed:', error);
//         throw error;
//     }
// };

// // Main controller function
// exports.LoanRcaDataStore = async (req, res, next) => {
//     const client = await pool.connect();
    
//     try {
//         // Get schema name from config or environment
//         const db = process.env.DB_SCHEMA || 'dcs'; // Using 'dcs' as default schema
//         const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
        
//         // Handle JSON data - req.body.json is already an object, no need to parse
//         const dataset = req.body.json;
//         logger.info('Loan Rca Data: ' + JSON.stringify(dataset));
        
//         // Validate that dataset exists and has required structure
//         if (!dataset || !dataset.loan || !dataset.rca) {
//             return res.json({
//                 status: 'E',
//                 message: 'Invalid request structure. Missing loan or rca data.'
//             });
//         }
        
//         if (!Array.isArray(dataset.loan) || !Array.isArray(dataset.rca)) {
//             return res.json({
//                 status: 'E',
//                 message: 'Loan and RCA data must be arrays.'
//             });
//         }
        
//         if (dataset.loan.length === 0 || dataset.rca.length === 0) {
//             return res.json({
//                 status: 'E',
//                 message: 'Loan and RCA arrays cannot be empty.'
//             });
//         }
        
//         const data = dataset.loan[0];
//         const dataRca = dataset.rca[0];
        
//         // Extract and format data
//         let projectcode = padZero(data.project_code, 3);
//         const token = req.body.token;
//         let branchcode = padZero(data.branch_code, 4);
        
//         // Validate token
//         if (!validateToken(token)) {
//             return res.json({
//                 status: 'E',
//                 message: 'Token Invalid'
//             });
//         }
        
//         // Check if orgmemno is empty
//         if (!data.orgmemno || data.orgmemno === '') {
//             return res.json({
//                 status: 'E',
//                 message: 'দয়া করে প্রথম পেজে সিঙ্ক করে তারপরে আবার ট্রাই করুন।'
//             });
//         }
        
//         // Initialize variables
//         const roleid = 0;
//         let reciverrole = 1;
//         const status = 1;
//         const orgno = data.vo_code;
//         const loanid = data.loan_id;
//         const pin = data.pin;
//         const assignedpo = data.pin;
//         const updatedate = moment().format('YYYY-MM-DD HH:mm:ss');
        
//         // Extract all loan data
//         const loanData = {
//             mem_id: data.mem_id || null, // Handle null/undefined mem_id
//             loan_product: data.loan_product,
//             loan_duration: data.loan_duration,
//             invest_sector: data.invest_sector,
//             propos_amt: data.propos_amt,
//             instal_amt: data.instal_amt,
//             bracloan_family: data.bracloan_family,
//             vo_leader: data.vo_leader,
//             recommender: data.recommender,
//             grntor_name: data.grntor_name,
//             grntor_phone: data.grntor_phone,
//             grntor_rlationClient: data.grntor_rlationClient,
//             grntor_nid: data.grntor_nid,
//             witness_knows: data.witness_knows,
//             residence_type: data.residence_type,
//             residence_duration: data.residence_duration,
//             houseowner_knows: data.houseowner_knows || null,
//             reltive_presAddress: data.reltive_presAddress,
//             reltive_name: data.reltive_name,
//             reltive_phone: data.reltive_phone,
//             insurn_type: data.insurn_type,
//             insurn_option: data.insurn_option,
//             insurn_spouseName: data.insurn_spouseName,
//             insurn_spouseNid: data.insurn_spouseNid,
//             insurn_spouseDob: data.insurn_spouseDob,
//             insurn_gender: data.insurn_gender,
//             insurn_relation: data.insurn_relation,
//             insurn_name: data.insurn_name,
//             insurn_dob: data.insurn_dob,
//             insurn_mainID: data.insurn_mainID,
//             grantor_nidfront_photo: data.grantor_nidfront_photo,
//             grantor_nidback_photo: data.grantor_nidback_photo,
//             grantor_photo: data.grantor_photo,
//             erp_mem_id: data.erp_mem_id,
//             memberTypeId: data.memberTypeId,
//             subSectorId: data.subSectorId,
//             frequencyId: data.frequencyId,
//             insurn_mainIDType: data.insurn_mainIDType,
//             insurn_id_expire: data.insurn_id_expire,
//             insurn_placeofissue: data.insurn_placeofissue,
//             surveyid: data.surveyid,
//             orgmemno: data.orgmemno,
//             amount_inword: data.amount_inword,
//             loan_purpose: data.loan_purpose,
//             loan_user: data.loan_user,
//             loan_type: data.loan_type,
//             brac_loancount: data.brac_loancount,
//             approval_amount: data.propos_amt,
//             premium_amount: data.premium_amount || null,
//             savings_selected_Items: data.savings_selected_Items ? JSON.stringify(JSON.parse(data.savings_selected_Items)) : null,
//             passbook_required: data.passbook_required || null,
//             quotation_paper_Image: data.quotation_paper_Image || null,
//             previous_loan_amt: data.prevLoanAmnt || null,
//             previous_loan_instlmnt: data.prevLoanDuration || null,
//             profile_enrolment_id: data.profile_enrolment_id || null,
//             csi_insurer_name: data.csi_insurer_name || 0,
//             DynamicFieldValue: data.extra || null,
//             scheme: data.scheme,
//             projectcode: projectcode,
//             branchcode: branchcode,
//             pin: pin,
//             roleid: roleid,
//             reciverrole: reciverrole,
//             status: status,
//             loan_id: loanid,
//             assignedpo: assignedpo,
//             orgno: orgno,
//             update_at: updatedate
//         };
        
//         // Get server URLs
//         const serverUrls = await getServerUrl(client, db);
//         if (serverUrls.status) {
//             return res.json(serverUrls);
//         }
        
//         const [url, url2, baseurl] = serverUrls;
        
//         // Make API call to get member data
//         const memberUrl = `${url}MemberList?BranchCode=${branchcode}&ProjectCode=${projectcode}&CONo=${assignedpo}&OrgNo=${orgno}&OrgMemNo=${data.orgmemno}&key=5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae&Status=2`;
        
//         try {
//             const memberData = await makeHttpRequest(memberUrl);
//             const memberDecode = typeof memberData === 'string' ? JSON.parse(memberData) : memberData;
            
//             if (memberDecode.data && memberDecode.data.length > 0) {
//                 const memberInfo = memberDecode.data;
//                 if (memberInfo.length === 1) {
//                     const loanCycleNo = memberInfo[0].LoanCycleNo;
//                     if (loanCycleNo > 0) {
//                         loanData.loan_type = 'Repeat';
//                         loanData.brac_loancount = loanCycleNo;
//                     }
//                 }
//             }
//         } catch (error) {
//             logger.error('Error fetching member data:', error);
//         }
        
//         // Start transaction
//         await client.query('BEGIN');
        
//         try {
//             // Check if loan exists
//             const checkQuery = `SELECT id, loan_id FROM ${db}.loans WHERE loan_id = $1`;
//             const checkResult = await client.query(checkQuery, [loanid]);
            
//             let docId;
            
//             if (checkResult.rows.length === 0) {
//                 // Insert new loan
//                 const insertFields = Object.keys(loanData).map((key, index) => `"${key}"`).join(', ');
//                 const insertValues = Object.keys(loanData).map((_, index) => `$${index + 1}`).join(', ');
//                 const insertQuery = `INSERT INTO ${db}.loans (${insertFields}) VALUES (${insertValues}) RETURNING id`;
                
//                 const insertResult = await client.query(insertQuery, Object.values(loanData));
//                 docId = insertResult.rows[0].id;
//             } else {
//                 // Update existing loan
//                 docId = checkResult.rows[0].id;
//                 const existingLoanId = checkResult.rows[0].loan_id;
                
//                 const updateFields = Object.keys(loanData).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
//                 const updateQuery = `UPDATE ${db}.loans SET ${updateFields} WHERE loan_id = $${Object.keys(loanData).length + 1}`;
                
//                 await client.query(updateQuery, [...Object.values(loanData), existingLoanId]);
//             }
            
//             // Prepare RCA data
//             const rcaData = {
//                 loan_id: docId,
//                 primary_earner: dataRca.primary_earner || 1,
//                 monthlyincome_main: dataRca.monthlyincome_main,
//                 monthlyincome_other: dataRca.monthlyincome_other,
//                 house_rent: dataRca.house_rent,
//                 food: dataRca.food,
//                 education: dataRca.education,
//                 medical: dataRca.medical,
//                 festive: dataRca.festive,
//                 utility: dataRca.utility,
//                 saving: dataRca.saving,
//                 other: dataRca.other,
//                 monthly_instal: dataRca.monthly_instal,
//                 debt: dataRca.debt,
//                 monthly_cash: dataRca.monthly_cash,
//                 monthlyincome_spouse_child: dataRca.monthlyincome_spouse_child,
//                 instal_proposloan: dataRca.instal_proposloan,
//                 DynamicFieldValue: dataRca.extra || null,
//                 po_seasonal_income: dataRca.po_seasonal_income,
//                 po_incomeformfixedassets: dataRca.po_incomeformfixedassets,
//                 po_imcomeformsavings: dataRca.po_imcomeformsavings,
//                 po_houseconstructioncost: dataRca.po_houseconstructioncost,
//                 po_expendingonmarriage: dataRca.po_expendingonmarriage,
//                 po_operation_childBirth: dataRca.po_operation_childBirth,
//                 po_foreigntravel: dataRca.po_foreigntravel
//             };
            
//             // Insert or update RCA data
//             if (checkResult.rows.length === 0) {
//                 // Insert new RCA
//                 const rcaInsertFields = Object.keys(rcaData).map((key, index) => `"${key}"`).join(', ');
//                 const rcaInsertValues = Object.keys(rcaData).map((_, index) => `$${index + 1}`).join(', ');
//                 const rcaInsertQuery = `INSERT INTO ${db}.rca (${rcaInsertFields}) VALUES (${rcaInsertValues})`;
                
//                 await client.query(rcaInsertQuery, Object.values(rcaData));
//             } else {
//                 // Update existing RCA
//                 const rcaUpdateFields = Object.keys(rcaData).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
//                 const rcaUpdateQuery = `UPDATE ${db}.rca SET ${rcaUpdateFields} WHERE loan_id = $${Object.keys(rcaData).length + 1}`;
                
//                 await client.query(rcaUpdateQuery, [...Object.values(rcaData), docId]);
//             }
            
//             // Commit transaction
//             await client.query('COMMIT');
            
//             // Make document manager API call
//             const documentUrl = `${baseUrl}/DocumentManager?doc_id=${docId}&projectcode=${projectcode}&doc_type=loan&pin=${pin}&role=0&branchcode=${branchcode}&action=Request`;
//             logger.info('Document_url : ' + documentUrl);
            
//             try {
//                 const documentResponse = await makeHttpRequest(documentUrl);
//                 const documentResult = typeof documentResponse === 'string' ? JSON.parse(documentResponse) : documentResponse;
                
//                 if (documentResult.status === 'S') {
//                     // Success response
//                     const result = {
//                         status: "S",
//                         message: "অভিনন্দন! লোনের আবেদন সফলভাবে পাঠানো হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
//                     };
                    
//                     // Here you would typically create notification
//                     // (new CreateNotificationService())->create_notification(...)
                    
//                     return res.json(result);
//                 } else {
//                     return res.json(documentResult);
//                 }
//             } catch (docError) {
//                 logger.error('Document manager API error:', docError);
//                 return res.json({
//                     status: 'E',
//                     message: 'Document processing failed'
//                 });
//             }
            
//         } catch (dbError) {
//             await client.query('ROLLBACK');
//             logger.error('Database error:', dbError);
//             return res.json({
//                 status: 'E',
//                 message: dbError.message
//             });
//         }
        
//     } catch (error) {
//         logger.error('Main error:', error);
//         return res.json({
//             status: 'E',
//             message: error.message
//         });
//     } finally {
//         client.release();
//     }
// };










// exports.admission_store = async (req, res) => {
//     let client;
//     try {
//         const request = req.body;
//         let result = [];
//         const db = 'public'; // Adjust this based on your database schema
        
//         // Log rotation equivalent would be handled by your logging library (winston/morgan/etc)
        
//         let doc_id = 0;
//         const baseUrl = req.protocol + '://' + req.get('host');
//         const json = request.json;
//         const token = request.token;
        
//         logger.info('Admission Json Data Form Tab' + json);
        
//         const dataset = JSON.parse(json);
//         const flag = dataset.flag;
//         const data = dataset.data;
//         const dynamicfieldvalue = dataset.extra || '';
        
//         const projectcode = String(data[0].project_code).padStart(3, "0");
//         // const branchcode = String(data[0].branch_code).padStart(4, "0");
//         const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        
//         if (token !== '7f30f4491cb4435984616d1913e88389') {
//             return res.status(400).json({ status: 'E', message: "Token Invalid" });
//         }
        
//         // Here you would need to implement CheckPointAdmissionService equivalent
//         const CheckPoint = await checkPointAdmission(db, data[0].vo_code, data[0].pin, data[0].erp_mem_id, branchcode, projectcode, data[0].enroll_id, flag);
        
//         if (CheckPoint !== 'success') {
//             return res.status(400).json(JSON.parse(CheckPoint));
//         }
        
//         client = await pool.connect();
//         await client.query('BEGIN');
        
//         let roleid = 0;
//         let reciverrole = 1;
//         let notsendinerp = 3;
//         const datas = dataset.data[0];
//         let can_change_nine_field = true;
        
//         if (flag == 2) {
//             // Implement Get_Validation_Check_9Points equivalent
//             const response_Get_Profile_Validation = await getValidationCheck9Points(datas, branchcode, projectcode);
            
//             let dataname = '';
//             if (response_Get_Profile_Validation !== false) {
//                 if (response_Get_Profile_Validation === 'can_change_this_time') {
//                     can_change_nine_field = false;
//                 } else if (response_Get_Profile_Validation === 'can_change_nine_field_false') {
//                     can_change_nine_field = false;
//                 } else if (response_Get_Profile_Validation === 'can_change_nine_field_true') {
//                     can_change_nine_field = true;
//                 } else if (response_Get_Profile_Validation != 2) {
//                     const cont = response_Get_Profile_Validation.length;
//                     for (let i = 0; i < cont; i++) {
//                         dataname += response_Get_Profile_Validation[i] + ',';
//                     }
//                     dataname = dataname.slice(0, -1);
//                     return res.status(400).json({ status: 'E', message: `আপনি ইতিমধ্যে একবার DCS ব্যবহার করে প্রোফাইল আপডেট করেছেন, তাই আপনি নিচের তথ্যগুলি পরিবর্তন করতে পারবেন না:${dataname} তবে, আপনি অন্যান্য তথ্য পরিবর্তন করতে পারবেন।` });
//                 }
//             }
//             notsendinerp = response_Get_Profile_Validation;
//         }
        
//         const status = 1;
//         const orgno = data[0].vo_code;
//         const entollmentid = data[0].enroll_id;
//         const MemberId = data[0].erp_mem_id;
//         const pin = data[0].pin;
//         const assignedpo = data[0].pin;
//         const branchcode = String(data[0].branch_code).padStart(4, "0");
        
//         // Extract all the fields from data[0]
//         const {
//             is_ref: IsRefferal,
//             refby: RefferedById,
//             refname: ReffererName,
//             refphone: ReffererPhone,
//             mem_category: MemberCateogryId,
//             applicant_name: ApplicantsName,
//             mainid_type: MainIdTypeId,
//             mainid_number: IdNo,
//             other_idtype: OtherIdTypeId,
//             other_idnumber: OtherIdNo,
//             expiredate: ExpiryDate,
//             place_ofissue: IssuingCountry,
//             dob: DOB,
//             mother_name: MotherName,
//             father_name: FatherName,
//             education: EducationId,
//             occupation: Occupation,
//             phone: Phone,
//             isbkash: IsBkash,
//             wallet_no: WalletNo,
//             wallet_owner: WalletOwner,
//             present_adds: PresentAddress,
//             present_upazila: presentUpazilaId,
//             presentDistrictId: PresentDistrictId,
//             permanent_adds: PermanentAddress,
//             permanent_upazila: parmanentUpazilaId,
//             matrial: MaritalStatusId,
//             spouse_name: SpouseName,
//             spouse_nid: SpouseNidOrBid,
//             spouse_dob: SposeDOB,
//             spouse_occ: SpuseOccupationId,
//             total_family_mem: FamilyMemberNo,
//             total_child: NoOfChildren,
//             nominee_name: NomineeName,
//             nominee_dob: NomineeDOB,
//             relationship: RelationshipId,
//             primary_earner: PrimaryEarner,
//             applicant_photo: ApplicantCpmbinedImg,
//             ref_photo: ReffererImg,
//             refid_photo: ReffererIdImg,
//             nidfront_photo: FrontSideOfIdImg,
//             nidback_photo: BackSideOfIdimg,
//             nominee_nid_photo: NomineeIdImg,
//             spouse_nid_photo: SpuseIdImg,
//             nominee_nid_no: NomineeNidNo,
//             nominee_nid_type: NomineeNidType,
//             nominee_nid_front: NomineeNidFront,
//             nominee_nid_back: NomineeNidBack,
//             spouse_nid_front: SpouseNidFront,
//             spouse_nid_back: SpouseNidBack,
//             genderid: GenderId,
//             savingsProductId: SavingsProductId,
//             nominee_id_expiredate: NomineeIdExpiredate,
//             nominee_id_place_ofissue: NomineeIdPlaceOfissue,
//             nominee_phone_number: NomineePhoneNumber,
//             spouse_card_type: SpouseCardType,
//             spouse_id_expiredate: SpouseIdExpiredate,
//             spouse_id_place_ofissue: SpouseIdPlaceOfissue,
//             applicant_single_pic: ApplicantSinglePic,
//             targetAmount: TargetAmount,
//             permanentDistrictId: PermanentDistrictId,
//             is_same_addss: IsSameAddress,
//             surveyid: surveyid,
//             otherReferee: otherReferee,
//             refByDropdown: refByDropdown,
//             disabled_mem_id = 0,
//             lactating_mother_id = 0,
//             expecting_mother_id = 0,
//             no_of_under_aged_child = 0,
//             no_of_school_child = 0,
//             org_member_no = null,
//             office_id_photo: office_id = null,
//             spouse_id_issuedate: spouseidissuedate = null,
//             applicant_passport_issuedate: applicant_passport_issuedate = '',
//             nomineeissuedate: nomineeissuedate = '',
//             rocketNo = null,
//             nominee_option_id = 0,
//             biometricInfo
//         } = data[0];
        
//         const updatedTime = moment().format('YYYY-MM-DD HH:mm:ss');
        
//         // Check if admission data exists
//         const checkAdmissionData = await client.query(
//             `SELECT * FROM ${db}.admissions WHERE branchcode = $1 AND assignedpo = $2 AND orgno = $3 AND entollmentid = $4`,
//             [branchcode, assignedpo, orgno, entollmentid]
//         );
        
//         if (checkAdmissionData.rows.length > 0) {
//             doc_id = checkAdmissionData.rows[0].id;
            
//             await client.query(
//                 `UPDATE ${db}.admissions SET 
//                 IsRefferal = $1, RefferedById = $2, ReffererName = $3, ReffererPhone = $4, 
//                 MemberCateogryId = $5, ApplicantsName = $6, MainIdTypeId = $7, IdNo = $8, 
//                 OtherIdTypeId = $9, OtherIdNo = $10, ExpiryDate = $11, IssuingCountry = $12, 
//                 DOB = $13, MotherName = $14, FatherName = $15, EducationId = $16, 
//                 Occupation = $17, Phone = $18, IsBkash = $19, WalletNo = $20, 
//                 WalletOwner = $21, PresentAddress = $22, presentUpazilaId = $23, 
//                 PermanentAddress = $24, parmanentUpazilaId = $25, MaritalStatusId = $26, 
//                 SpouseName = $27, SpouseNidOrBid = $28, SposeDOB = $29, SpuseOccupationId = $30, 
//                 FamilyMemberNo = $31, NoOfChildren = $32, NomineeName = $33, NomineeDOB = $34, 
//                 RelationshipId = $35, PrimaryEarner = $36, ApplicantCpmbinedImg = $37, 
//                 ReffererImg = $38, ReffererIdImg = $39, FrontSideOfIdImg = $40, 
//                 BackSideOfIdimg = $41, NomineeIdImg = $42, SpuseIdImg = $43, 
//                 DynamicFieldValue = $44, projectcode = $45, branchcode = $46, pin = $47, 
//                 roleid = $48, reciverrole = $49, status = $50, orgno = $51, assignedpo = $52, 
//                 NomineeNidNo = $53, NomineeNidFront = $54, NomineeNidBack = $55, 
//                 SpouseNidFront = $56, SpouseNidBack = $57, entollmentid = $58, GenderId = $59, 
//                 SavingsProductId = $60, NomineeIdExpiredate = $61, NomineeIdPlaceOfissue = $62, 
//                 NomineePhoneNumber = $63, SpouseCardType = $64, SpouseIdExpiredate = $65, 
//                 SpouseIdPlaceOfissue = $66, Flag = $67, ApplicantSinglePic = $68, 
//                 TargetAmount = $69, PermanentDistrictId = $70, NomineeNidType = $71, 
//                 MemberId = $72, IsSameAddress = $73, PresentDistrictId = $74, updated_at = $75, 
//                 surveyid = $76, update_at = $77, ref_by_dropdown = $78, other_referee = $79, 
//                 erp_member_id = $80, spouseidissuedate = $81, applicantissuedate = $82, 
//                 nomineeissuedate = $83, office_id = $84, disabled_mem_id = $85, 
//                 lactating_mother_id = $86, expecting_mother_id = $87, no_of_under_aged_child = $88, 
//                 no_of_school_child = $89, roket_number = $90, org_member_no = $91, 
//                 nominee_option_id = $92, can_change_nine_field = $93
//                 WHERE entollmentid = $58`,
//                 [
//                     IsRefferal, RefferedById, ReffererName, ReffererPhone, MemberCateogryId, 
//                     ApplicantsName, MainIdTypeId, IdNo, OtherIdTypeId, OtherIdNo, ExpiryDate, 
//                     IssuingCountry, DOB, MotherName, FatherName, EducationId, Occupation, 
//                     Phone, IsBkash, WalletNo, WalletOwner, PresentAddress, presentUpazilaId, 
//                     PermanentAddress, parmanentUpazilaId, MaritalStatusId, SpouseName, 
//                     SpouseNidOrBid, SposeDOB, SpuseOccupationId, FamilyMemberNo, NoOfChildren, 
//                     NomineeName, NomineeDOB, RelationshipId, PrimaryEarner, ApplicantCpmbinedImg, 
//                     ReffererImg, ReffererIdImg, FrontSideOfIdImg, BackSideOfIdimg, NomineeIdImg, 
//                     SpuseIdImg, dynamicfieldvalue, projectcode, branchcode, pin, roleid, 
//                     reciverrole, status, orgno, assignedpo, NomineeNidNo, NomineeNidFront, 
//                     NomineeNidBack, SpouseNidFront, SpouseNidBack, entollmentid, GenderId, 
//                     SavingsProductId, NomineeIdExpiredate, NomineeIdPlaceOfissue, NomineePhoneNumber, 
//                     SpouseCardType, SpouseIdExpiredate, SpouseIdPlaceOfissue, flag, 
//                     ApplicantSinglePic, TargetAmount, PermanentDistrictId, NomineeNidType, 
//                     MemberId, IsSameAddress, PresentDistrictId, currentTime, surveyid, 
//                     updatedTime, refByDropdown, otherReferee, MemberId, spouseidissuedate, 
//                     applicant_passport_issuedate, nomineeissuedate, office_id, disabled_mem_id, 
//                     lactating_mother_id, expecting_mother_id, no_of_under_aged_child, 
//                     no_of_school_child, rocketNo, org_member_no, nominee_option_id, can_change_nine_field
//                 ]
//             );
            
//             // Handle biometric info update
//             const verify_data = await client.query(
//                 `SELECT biometric_status FROM ${db}.admissions 
//                 WHERE entollmentid = $1`,
//                 [entollmentid]
//             );
            
//             if (!verify_data.rows.length || verify_data.rows[0].biometric_status != 1) {
//                 if (biometricInfo != null) {
//                     await storeBiometricInfo(branchcode, projectcode, orgno, assignedpo, entollmentid, JSON.stringify(biometricInfo));
//                 }
//             } else if (biometricInfo != null) {
//                 await client.query(
//                     `UPDATE ${this.db}.biometric_info SET 
//                     biometric_info = $1
//                     WHERE branchcode = $2 AND projectcode = $3 AND orgno = $4 AND 
//                     MemberId = $5 AND entollmentid = $6 AND assignedpo = $7`,
//                     [
//                         JSON.stringify(biometricInfo),
//                         branchcode, projectcode, orgno, MemberId, entollmentid, assignedpo
//                     ]
//                 );
//             }
//         } else {
//             // Insert new admission
//             const insertResult = await client.query(
//                 `INSERT INTO ${db}.admissions (
//                     IsRefferal, RefferedById, ReffererName, ReffererPhone, MemberCateogryId, 
//                     ApplicantsName, MainIdTypeId, IdNo, OtherIdTypeId, OtherIdNo, ExpiryDate, 
//                     IssuingCountry, DOB, MotherName, FatherName, EducationId, Occupation, 
//                     Phone, IsBkash, WalletNo, WalletOwner, PresentAddress, presentUpazilaId, 
//                     PermanentAddress, parmanentUpazilaId, MaritalStatusId, SpouseName, 
//                     SpouseNidOrBid, SposeDOB, SpuseOccupationId, FamilyMemberNo, NoOfChildren, 
//                     NomineeName, NomineeDOB, RelationshipId, PrimaryEarner, ApplicantCpmbinedImg, 
//                     ReffererImg, ReffererIdImg, FrontSideOfIdImg, BackSideOfIdimg, NomineeIdImg, 
//                     SpuseIdImg, DynamicFieldValue, projectcode, branchcode, pin, roleid, 
//                     reciverrole, status, orgno, assignedpo, NomineeNidNo, NomineeNidFront, 
//                     NomineeNidBack, SpouseNidFront, SpouseNidBack, entollmentid, GenderId, 
//                     SavingsProductId, NomineeIdExpiredate, NomineeIdPlaceOfissue, NomineePhoneNumber, 
//                     SpouseCardType, SpouseIdExpiredate, SpouseIdPlaceOfissue, Flag, 
//                     ApplicantSinglePic, TargetAmount, PermanentDistrictId, NomineeNidType, 
//                     MemberId, IsSameAddress, PresentDistrictId, surveyid, update_at, 
//                     ref_by_dropdown, other_referee, erp_member_id, spouseidissuedate, 
//                     applicantissuedate, nomineeissuedate, office_id, disabled_mem_id, 
//                     lactating_mother_id, expecting_mother_id, no_of_under_aged_child, 
//                     no_of_school_child, roket_number, org_member_no, nominee_option_id, can_change_nine_field
//                 ) VALUES (
//                     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
//                     $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 
//                     $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, 
//                     $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, 
//                     $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, 
//                     $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, 
//                     $81, $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93
//                 ) RETURNING id`,
//                 [
//                     IsRefferal, RefferedById, ReffererName, ReffererPhone, MemberCateogryId, 
//                     ApplicantsName, MainIdTypeId, IdNo, OtherIdTypeId, OtherIdNo, ExpiryDate, 
//                     IssuingCountry, DOB, MotherName, FatherName, EducationId, Occupation, 
//                     Phone, IsBkash, WalletNo, WalletOwner, PresentAddress, presentUpazilaId, 
//                     PermanentAddress, parmanentUpazilaId, MaritalStatusId, SpouseName, 
//                     SpouseNidOrBid, SposeDOB, SpuseOccupationId, FamilyMemberNo, NoOfChildren, 
//                     NomineeName, NomineeDOB, RelationshipId, PrimaryEarner, ApplicantCpmbinedImg, 
//                     ReffererImg, ReffererIdImg, FrontSideOfIdImg, BackSideOfIdimg, NomineeIdImg, 
//                     SpuseIdImg, dynamicfieldvalue, projectcode, branchcode, pin, roleid, 
//                     reciverrole, status, orgno, assignedpo, NomineeNidNo, NomineeNidFront, 
//                     NomineeNidBack, SpouseNidFront, SpouseNidBack, entollmentid, GenderId, 
//                     SavingsProductId, NomineeIdExpiredate, NomineeIdPlaceOfissue, NomineePhoneNumber, 
//                     SpouseCardType, SpouseIdExpiredate, SpouseIdPlaceOfissue, flag, 
//                     ApplicantSinglePic, TargetAmount, PermanentDistrictId, NomineeNidType, 
//                     MemberId, IsSameAddress, PresentDistrictId, surveyid, updatedTime, 
//                     refByDropdown, otherReferee, MemberId, spouseidissuedate, 
//                     applicant_passport_issuedate, nomineeissuedate, office_id, disabled_mem_id, 
//                     lactating_mother_id, expecting_mother_id, no_of_under_aged_child, 
//                     no_of_school_child, rocketNo, org_member_no, nominee_option_id, can_change_nine_field
//                 ]
//             );
            
//             doc_id = insertResult.rows[0].id;
            
//             // Store biometric info if exists
//             if (biometricInfo != null) {
//                 await storeBiometricInfo(branchcode, projectcode, orgno, assignedpo, entollmentid, JSON.stringify(biometricInfo));
//             }
//         }
        
//         await client.query('COMMIT');
        
//         let action = flag == 1 ? 'Request' : 'Modify';
//         const document_url = `${baseUrl}/DocumentManager?doc_id=${doc_id}&projectcode=${projectcode}&doc_type=admission&pin=${pin}&role=0&branchcode=${branchcode}&action=${action}`;
        
//         logger.info("Document Url" + document_url);
        
//         // Call document manager endpoint
//         try {
//             const documentResponse = await axios.get(document_url);
//             const collectionfordocument = documentResponse.data;
            
//             if (collectionfordocument.status === 'S') {
//                 let result;
//                 if (flag == '2') {
//                     result = { status: "S", message: "অভিনন্দন! প্রোফাইল আপডেটে রিকুয়েস্ট সফলভাবে পাঠানো হয়েছে।\n •আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।" };
//                 } else {
//                     result = { status: "S", message: "অভিনন্দন! সদস্য ভর্তির আবেদন সফলভাবে পাঠানো হয়েছে।\n •আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।" };
//                 }
                
//                 // Implement notification creation
//                 const poInfo = await getPO(branchcode, projectcode, assignedpo);
//                 const notification_info = {
//                     po_name: poInfo.length > 0 ? poInfo[0].coname : null,
//                     vo_code: orgno,
//                     member_name: ApplicantsName || null,
//                     member_code: org_member_no
//                 };
                
//                 await createNotification(db, projectcode, 'admission', doc_id, entollmentid, pin, roleid, branchcode, action, assignedpo, 'sync', 0, 0, reciverrole, notification_info, flag);
                
//                 return res.status(200).json(result);
//             } else {
//                 throw new Error('Document manager returned unsuccessful status');
//             }
//         } catch (error) {
//             throw new Error(`Document manager call failed: ${error.message}`);
//         }
//     } catch (error) {
//         if (client) {
//             await client.query('ROLLBACK');
//         }
//         logger.error(error.message);
//         return res.status(500).json({ status: 'E', message: error.message + " Line No " + error.lineNumber });
//     } finally {
//         if (client) {
//             client.release();
//         }
//     }
// };

// Helper functions that need to be implemented
async function checkPointAdmission(db, vo_code, pin, erp_mem_id, branchcode, projectcode, enroll_id, flag) {
    // Implement your checkpoint admission logic here
    return 'success'; // Default for now
}

async function getValidationCheck9Points(datas, branchcode, projectcode) {
    // Implement your validation logic here
    return false; // Default for now
}

async function storeBiometricInfo(branchcode, projectcode, orgno, assignedpo, entollmentid, biometricInfo) {
    // Implement biometric info storage
}

async function getPO(branchcode, projectcode, assignedpo) {
    // Implement PO retrieval
    return [];
}

async function createNotification(db, projectcode, doc_type, doc_id, entollmentid, pin, roleid, branchcode, action, assignedpo, command, actionstatus, erp_mem_id, reciverrole, notification_info, flag) {
    // Implement notification creation
}
















const DcsInsurancePremiumCalculationService = require('../services/DcsInsurancePremiumCalculationService');


exports.postDcsInstallmentCalculator = async (req, res) => {
    try {
        console.log('Incoming request body:', req.body);
        
        const service = new DcsInsurancePremiumCalculationService();
        const result = await service.calculate(req.body);

        console.log('Service result:', result);

        if (!result) {
            throw new Error('Service returned undefined result');
        }

        // Determine status code based on result status
        let statusCode = 200;
        if (result.status === 'E') {
            statusCode = result.validationError ? 400 : 500;
        }

        return res.status(statusCode).json(result);

    } catch (error) {
        console.error('Controller error:', error);
        
        return res.status(500).json({
            status: 'E',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                fullError: error
            } : undefined,
            timestamp: new Date().toISOString()
        });
    }
};

exports.bmAdmissionAssessment = async (req, res) => {
  try {
    const dataset = req.body;

    if (!dataset || !dataset.token || !dataset.admission) {
      return res.status(400).json({ status: 'E', message: 'Missing JSON payload' });
    }

    const token = dataset.token;
    const data = dataset.admission[0];

    logger.info(`Bm Assessment Admission Data: ${JSON.stringify(dataset)}`);

    if (token !== '7f30f4491cb4435984616d1913e88389') {
      logger.info('Bm Admission Assessment Invalid Token.');
      return res.status(400).json({ status: 'E', message: 'Invalid token!' });
    }

    const dbSchema = 'dcs';
    const projectcode = data.project_code.toString().padStart(3, '0');
    const branchcode = data.branch_code.toString().padStart(4, '0');
    const orgno = data.vo_code;
    const pin = data.pin;
    const entollmentid = data.mem_id;
    const MemberId = data.erp_mem_id;
    const bm_behavior = data.behavior;
    const bm_financial_status = data.financial_status;
    const bm_client_house_image = data.client_house_image;
    const bm_lat = data.lat;
    const bm_lng = data.lng;
    const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let result;
      if (entollmentid) {
        result = await client.query(
          `UPDATE ${dbSchema}.admissions 
           SET bm_behavior = $1, bm_financial_status = $2, bm_client_house_image = $3, 
               bm_lat = $4, bm_lng = $5, update_at = $6 
           WHERE entollmentid = $7`,
          [bm_behavior, bm_financial_status, bm_client_house_image, bm_lat, bm_lng, updatedAt, entollmentid]
        );
      } else {
        result = await client.query(
          `UPDATE ${dbSchema}.admissions 
           SET bm_behavior = $1, bm_financial_status = $2, bm_client_house_image = $3, 
               bm_lat = $4, bm_lng = $5, update_at = $6 
           WHERE "MemberId" = $7`,
          [bm_behavior, bm_financial_status, bm_client_house_image, bm_lat, bm_lng, updatedAt, MemberId]
        );
      }

      if (result.rowCount > 0) {
        await client.query('COMMIT');
        logger.info('Bm Admission Assessment Successful.');
        return res.json({ status: 'S', message: 'Data saved' });
      } else {
        await client.query('ROLLBACK');
        return res.status(404).json({ status: 'E', message: 'No matching record found' });
      }
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Bm Admission Assessment Exception:', err.message);
      return res.status(500).json({ status: 'E', message: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('JSON Parse Error:', err.message);
    return res.status(400).json({ status: 'E', message: 'Invalid JSON format' });
  }
};



































// Required modules

// --- Placeholder Services (You need to implement these) ---

// In a real application, each of these would be a separate module/file.
const getValidated = (request) => {
    // Implement your validation logic here.
    // For now, a basic check.
    if (!request.json || !request.token) {
        return "Invalid request data.";
    }
    try {
        const dataset = JSON.parse(request.json);
        if (!dataset.loan || !Array.isArray(dataset.loan) || dataset.loan.length === 0) {
            return "Loan data is missing or invalid.";
        }
        if (!dataset.rca || !Array.isArray(dataset.rca) || dataset.rca.length === 0) {
            return "RCA data is missing or invalid.";
        }
        return "success"; // Or the validated data
    } catch (e) {
        return "Invalid JSON format.";
    }
};

const laravelLogService = () => {
    // Implement logging service (e.g., using winston)
    console.log('Laravel log service called (placeholder)');
};

const checkpointLoanService = async (dbClient, vo_code, pin, erp_mem_id, branchcode, orgmemno, loan_id, projectcode, mem_id) => {
    // Implement your checkpoint logic.
    // This is a placeholder.
    console.log('Checkpoint loan service called (placeholder)');
    return 'success'; // Or an error message/object
};

const findHierarchyRoleService = (role, projectcode) => {
    // Implement logic to find receiver role based on hierarchy.
    // This is a placeholder.
    console.log('Find hierarchy role service called (placeholder)');
    return [2, 0, 'some_leave_message']; // Example return: [reciverrole, roleid, leave_comments]
};

const serverURLService = () => {
    // Implement logic to get server URLs.
    // This is a placeholder.
    console.log('Server URL service called (placeholder)');
    return ["http://your-erp-api-url.com/", "http://your-other-api-url.com/"]; // Example URLs
};

const exceptionMessageService = (message) => {
    console.error(`Exception message: ${message}`);
    return { status: 'E', message: message };
};

const createNotificationService = async (dbClient, projectcode, doc_type, doc_id, entollmentid, pin, roleid, branchcode, action, assignedpo, command, actionstatus, erp_mem_id, reciverrole, notification_info, additionalInfo) => {
    // Implement your notification creation logic.
    // This is a placeholder.
    console.log('Notification service called (placeholder)', notification_info);
    // Example: Insert into a notifications table
    // await dbClient.query(`INSERT INTO notifications (...) VALUES (...)`);
    return { status: 'S', message: 'Notification sent successfully (placeholder)' };
};

const liveApiIndividualGetPOService = () => {
    // Implement logic to get PO details.
    // This is a placeholder.
    console.log('Live API Individual Get PO service called (placeholder)');
    return [{ coname: 'Sample PO Name' }];
};

// --- Main Controller Function ---


// exports.getDocumentManager = async (req, res, next) => {
//     res.send("Hello from getDocumentManager!");
// }   

// exports.postDcsInstallmentCalculator = async(req, res, next) => {
//     res.send("hello dcs installment");
// }

// exports.BmAdmissionAssessmentStore = async(req, res, next) => {
//     res.send("hello BmAdmissionAssessmentStore");
// }


// document

exports.document_manager = async (req, res) => {
    const client = await pool.connect();
    try {
        // Set schema search path for this connection
        await client.query('SET search_path TO dcs, public');

        // Extract request parameters
        const {
            branchCode, branchcode,
            projectCode, projectcode,
            pin,
            entollmentid,
            doc_type,
            doc_id,
            role: roleid,
            action,
            comment,
            sender
        } = req.body;

        // Use camelCase or snake_case versions
        const finalBranchCode = branchCode || branchcode;
        const finalProjectCode = projectCode || projectcode;

        // Get username from headers
        const username = req.headers['username'] || null;
        const erpUserRole = req.headers['erpuserrole'] || null;

        // Validate required parameters
        if (!finalBranchCode || !finalProjectCode || !pin || !doc_type) {
            return res.status(400).json({
                status: 'E',
                message: 'Missing required parameters (branchCode, projectCode, pin, doc_type)'
            });
        }

        // Log the request
        console.log(`BMSubmit-http://dcs.brac.net/dcs/DocumentManager?doc_id=${doc_id}&projectcode=${finalProjectCode}&doc_type=${doc_type}&pin=${pin}&role=${roleid}&branchcode=${finalBranchCode}&action=${action}&entollmentid=${entollmentid}&comment=${comment}`);

        // Get process ID based on doc_type
        let processid;
        if (doc_type === 'admission') {
            const processRes = await client.query(
                'SELECT id FROM processes WHERE process = $1', 
                ['member admission']
            );
            if (!processRes.rows.length) {
                return res.status(404).json({ 
                    status: 'E', 
                    message: 'Process "member admission" not found', 
                    code: "404" 
                });
            }
            processid = processRes.rows[0].id;
        } else if (doc_type === 'loan') {
            const processRes = await client.query(
                'SELECT id FROM processes WHERE process = $1', 
                ['loan application']
            );
            if (!processRes.rows.length) {
                return res.status(404).json({ 
                    status: 'E', 
                    message: 'Process "loan application" not found', 
                    code: "404" 
                });
            }
            processid = processRes.rows[0].id;
        } else {
            return res.status(404).json({ 
                status: 'E', 
                message: 'Document Type Not Found!', 
                code: "404" 
            });
        }

        // Handle doc_id and entollmentid logic
        let finalDocId = doc_id;
        let finalEntollmentId = entollmentid;
        let assignedpo, erp_mem_id, flag, loan_type, ApprovalAmount, proposeAmount;

        if (!doc_id && entollmentid) {
            if (doc_type === 'admission') {
                const docRes = await client.query(
                    'SELECT id FROM admissions WHERE entollmentid = $1', 
                    [entollmentid]
                );
                if (!docRes.rows.length) {
                    return res.status(404).json({ 
                        status: 'E', 
                        message: 'Admission not found' 
                    });
                }
                finalDocId = docRes.rows[0].id;
            } else if (doc_type === 'loan') {
                const docRes = await client.query(
                    'SELECT id FROM loans WHERE loan_id = $1', 
                    [entollmentid]
                );
                if (!docRes.rows.length) {
                    return res.status(404).json({ 
                        status: 'E', 
                        message: 'Loan not found' 
                    });
                }
                finalDocId = docRes.rows[0].id;
            }
        } else if (doc_id && !entollmentid) {
            if (doc_type === 'admission') {
                const docRes = await client.query(
                    'SELECT entollmentid FROM admissions WHERE id = $1', 
                    [doc_id]
                );
                if (!docRes.rows.length) {
                    return res.status(404).json({ 
                        status: 'E', 
                        message: 'Admission not found' 
                    });
                }
                finalEntollmentId = docRes.rows[0].entollmentid;
            } else if (doc_type === 'loan') {
                const docRes = await client.query(
                    'SELECT loan_id FROM loans WHERE id = $1', 
                    [doc_id]
                );
                if (!docRes.rows.length) {
                    return res.status(404).json({ 
                        status: 'E', 
                        message: 'Loan not found' 
                    });
                }
                finalEntollmentId = docRes.rows[0].loan_id;
            }
        }

        // Get document details
        let document;
        if (doc_type === 'admission') {
            const docRes = await client.query(
                'SELECT * FROM admissions WHERE id = $1', 
                [finalDocId]
            );
            if (!docRes.rows.length) {
                return res.status(404).json({ 
                    status: 'E', 
                    message: 'Admission not found' 
                });
            }
            document = docRes.rows[0];
            flag = document.flag;
            erp_mem_id = document.memberid;
            assignedpo = document.assignedpo;
        } else if (doc_type === 'loan') {
            const docRes = await client.query(
                'SELECT * FROM loans WHERE id = $1', 
                [finalDocId]
            );
            if (!docRes.rows.length) {
                return res.status(404).json({ 
                    status: 'E', 
                    message: 'Loan not found' 
                });
            }
            document = docRes.rows[0];
            loan_type = document.loan_type;
            ApprovalAmount = document.approval_amount;
            proposeAmount = document.propos_amt;
            erp_mem_id = document.erp_mem_id;
            assignedpo = document.assignedpo;
        }

        const reciverrole = document.reciverrole;
        const status = 1;

        // Get action ID
        const actionRes = await client.query(
            'SELECT id FROM action_lists WHERE actionname = $1 AND process_id = $2 AND projectcode = $3',
            [action, processid, finalProjectCode]
        );

        if (!actionRes.rows.length) {
            return res.status(404).json({ 
                status: 'E', 
                message: 'Action Not Found!' 
            });
        }

        const actionid = actionRes.rows[0].id;

        // Handle different actions
        if (action === 'Request' || action === 'Modify') {
            await client.query('BEGIN');

            // Insert document history
            const historyRes = await client.query(
                `INSERT INTO document_history 
                (doc_id, doc_type, pin, action, projectcode, roleid, reciverrole) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING id`,
                [finalDocId, doc_type, pin, actionid, finalProjectCode, roleid, reciverrole]
            );
            const dochistory_id = historyRes.rows[0].id;

            // Update document status
            let updateQuery, updateParams;
            if (doc_type === 'admission') {
                updateQuery = `
                    UPDATE admissions 
                    SET dochistory_id = $1, roleid = $2, pin = $3, 
                        reciverrole = $4, status = $5, sender = $6 
                    WHERE id = $7
                `;
                updateParams = [
                    dochistory_id, roleid, pin, reciverrole, status, sender, finalDocId
                ];
            } else {
                updateQuery = `
                    UPDATE loans 
                    SET dochistory_id = $1, roleid = $2, pin = $3, 
                        reciverrole = $4, status = $5, sender = $6 
                    WHERE id = $7
                `;
                updateParams = [
                    dochistory_id, roleid, pin, reciverrole, status, sender, finalDocId
                ];
            }

            const updateRes = await client.query(updateQuery, updateParams);

            if (updateRes.rowCount > 0) {
                await client.query('COMMIT');
                
                // Here you would call email and notification services
                // await sendEmailNotification(...);
                // await createNotification(...);

                return res.json({ 
                    status: "S", 
                    message: "Document history saved" 
                });
            } else {
                await client.query('ROLLBACK');
                return res.status(500).json({ 
                    status: 'E', 
                    message: 'Failed to update document' 
                });
            }
        } else {
            // Handle other actions (Recommend, Sendback, Reject, Approve)
            if (roleid != reciverrole) {
                return res.status(400).json({ 
                    status: 'E', 
                    message: 'Document has been processed.' 
                });
            }

            // Check authorization
            const authCheck = await checkRoleAuthorization(client, reciverrole, processid, finalProjectCode);
            if (!authCheck) {
                return res.status(403).json({ 
                    status: 'E', 
                    message: `User Not Authorization! This ProjectCode ${finalProjectCode}` 
                });
            }

            // Find hierarchy roles
            const findHierarchyRole = await findRoleHierarchy(client, reciverrole, finalProjectCode);
            const nextrole = findHierarchyRole[0];
            const nextroledesig = findHierarchyRole[1];

            const findPreviousRole = await findPreviousRole(client, reciverrole, finalProjectCode);
            const Previousrole = findPreviousRole[0];
            const Previousroledesig = findPreviousRole[1];

            if (!action) {
                return res.status(400).json({ 
                    status: 'E', 
                    message: 'Action Not Found!' 
                });
            }

            // Handle different actions
            if (action === 'Recommend') {
                const checkApprove = await handleRecommendAction(
                    client, nextrole, nextroledesig, action, reciverrole, pin, 
                    processid, doc_type, finalDocId, finalProjectCode, comment, sender
                );

                if (checkApprove) {
                    if (doc_type === 'loan') {
                        // Handle loan recommendation specific logic
                        const firstRecommender = await client.query(
                            'SELECT * FROM buffer_loan_recommander_approver_info WHERE loan_id = $1',
                            [document.loan_id]
                        );

                        if (!firstRecommender.rows.length || !firstRecommender.rows[0].recommander_pin) {
                            const abmRes = await client.query(
                                'SELECT abm FROM polist WHERE cono = $1', 
                                [document.assignedpo]
                            );
                            const abm = abmRes.rows[0]?.abm || 0;

                            let userName = username;
                            if (!userName) {
                                const userRes = await client.query(
                                    'SELECT coname FROM polist WHERE cono = $1', 
                                    [pin]
                                );
                                userName = userRes.rows[0]?.coname || '';
                            }

                            const roleHierarchyRes = await client.query(
                                'SELECT role FROM role_hierarchies WHERE trendxrole = $1 AND projectcode = $2',
                                [roleid, finalProjectCode]
                            );

                            await client.query(
                                `INSERT INTO buffer_loan_recommander_approver_info 
                                (loan_id, branchcode, assignedpo, is_abm, recommander_role, 
                                 recommander_name, recommander_pin, recommander_date, updated_at) 
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [
                                    document.loan_id,
                                    finalBranchCode,
                                    document.assignedpo,
                                    abm ? 1 : 0,
                                    roleHierarchyRes.rows[0]?.role || '',
                                    userName,
                                    pin,
                                    new Date(),
                                    new Date()
                                ]
                            );
                        }
                    }

                    let result;
                    if (doc_type === 'loan') {
                        result = {
                            status: "CUSTMSG",
                            title: "সুপারিশ-",
                            message: "অভিনন্দন! লোনের আবেদন সফলভাবে সুপারিশ করা হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
                        };
                    } else {
                        result = {
                            status: "CUSTMSG",
                            title: "সুপারিশ-",
                            message: "অভিনন্দন! প্রোফাইল আপডেট রিকুয়েস্ট সফলভাবে সুপারিশ করা হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
                        };
                    }

                    return res.json(result);
                }
            } else if (action === 'Sendback') {
                const checkApprove = await handleSendbackAction(
                    client, Previousrole, Previousroledesig, action, reciverrole, 
                    pin, processid, doc_type, finalDocId, finalProjectCode, comment, sender
                );

                if (checkApprove) {
                    let result;
                    if (doc_type === 'admission') {
                        if (flag != 1) {
                            result = {
                                status: "CUSTMSG",
                                title: "সেন্ডব্যাক-",
                                message: "অভিনন্দন! প্রোফাইল আপডেট রিকুয়েস্ট সফলভাবে সেন্ডব্যাক করা হয়েছে।\n•পিও সংশোধন করে পাঠালে অনুমোদন করতে পারবেন।"
                            };
                        } else {
                            result = {
                                status: "CUSTMSG",
                                title: "সেন্ডব্যাক-",
                                message: "অভিনন্দন! ভর্তি আবেদন সফলভাবে সেন্ডব্যাক করা হয়েছে।\n•পিও সংশোধন করে পাঠালে অনুমোদন করতে পারবেন।"
                            };
                        }
                    } else {
                        result = {
                            status: "CUSTMSG",
                            title: "সেন্ডব্যাক-",
                            message: "অভিনন্দন! লোনের আবেদন সফলভাবে সেন্ডব্যাক করা হয়েছে।\n•পিও সংশোধন করে পাঠালে অনুমোদন করতে পারবেন।"
                        };
                    }

                    return res.json(result);
                }
            } else if (action === 'Reject') {
                const checkApprove = await handleRejectAction(
                    client, Previousrole, Previousroledesig, action, reciverrole, 
                    pin, processid, doc_type, finalDocId, finalProjectCode, comment, sender
                );

                if (checkApprove) {
                    let result;
                    if (doc_type === 'admission') {
                        if (flag != 1) {
                            result = {
                                status: "CUSTMSG",
                                title: "রিজেক্ট -",
                                message: "অভিনন্দন! প্রোফাইল আপডেট আবেদন সফলভাবে রিজেক্ট করা হয়েছে।"
                            };
                        } else {
                            result = {
                                status: "CUSTMSG",
                                title: "রিজেক্ট -",
                                message: "অভিনন্দন! ভর্তি আবেদন সফলভাবে রিজেক্ট করা হয়েছে।"
                            };
                        }
                    } else {
                        result = {
                            status: "CUSTMSG",
                            title: "রিজেক্ট -",
                            message: "অভিনন্দন! লোনের আবেদন সফলভাবে রিজেক্ট করা হয়েছে।"
                        };
                    }

                    return res.json(result);
                }
            } else if (action === 'Approve') {
                if (doc_type === 'loan') {
                    // Check approval amount
                    const amountCheck = await checkApprovalAmount(
                        client, finalBranchCode, finalProjectCode, 
                        loan_type, proposeAmount, roleid, ApprovalAmount
                    );

                    if (amountCheck && amountCheck.status === 'E') {
                        return res.status(400).json(amountCheck);
                    }

                    // Update buffer loan recommender/approver info
                    let userName = username;
                    if (!userName) {
                        const userRes = await client.query(
                            'SELECT coname FROM polist WHERE cono = $1', 
                            [pin]
                        );
                        userName = userRes.rows[0]?.coname || '';
                    }

                    const roleHierarchyRes = await client.query(
                        'SELECT role FROM role_hierarchies WHERE trendxrole = $1 AND projectcode = $2',
                        [roleid, finalProjectCode]
                    );

                    const bufferInfo = {
                        loan_id: document.loan_id,
                        branchcode: finalBranchCode,
                        assignedpo: document.assignedpo,
                        approver_role: roleHierarchyRes.rows[0]?.role || '',
                        approver_name: userName,
                        approver_pin: pin,
                        approver_date: new Date(),
                        updated_at: new Date()
                    };

                    const firstApprover = await client.query(
                        'SELECT * FROM buffer_loan_recommander_approver_info WHERE loan_id = $1',
                        [document.loan_id]
                    );

                    if (!firstApprover.rows.length) {
                        await client.query(
                            `INSERT INTO buffer_loan_recommander_approver_info 
                            (loan_id, branchcode, assignedpo, approver_role, 
                             approver_name, approver_pin, approver_date, updated_at) 
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            Object.values(bufferInfo)
                        );
                    } else {
                        await client.query(
                            `UPDATE buffer_loan_recommander_approver_info 
                            SET approver_role = $1, approver_name = $2, approver_pin = $3, 
                                approver_date = $4, updated_at = $5 
                            WHERE loan_id = $6`,
                            [
                                bufferInfo.approver_role,
                                bufferInfo.approver_name,
                                bufferInfo.approver_pin,
                                bufferInfo.approver_date,
                                bufferInfo.updated_at,
                                bufferInfo.loan_id
                            ]
                        );
                    }
                }

                // ERP posting
                const erpResponse = await postToErp(finalDocId, doc_type);
                if (erpResponse.status !== 200) {
                    if (doc_type === 'admission') {
                        if (erpResponse.data?.message === "Buffer Member already exists with given id.") {
                            const id = erpResponse.data?.id;
                            await client.query(
                                'UPDATE admissions SET ErpStatus = 1, erpstatus = 1 WHERE entollmentid = $1',
                                [id]
                            );
                            console.log(`Bits Server message Local Status Done Type ${doc_type} Id ${id}`);
                        }
                    } else {
                        if (erpResponse.data?.message === "Buffer Loan Proposal already exists with given id.") {
                            const id = erpResponse.data?.id;
                            await client.query(
                                'UPDATE loans SET ErpStatus = 1, erpstatus = 1 WHERE loan_id = $1',
                                [id]
                            );
                            console.log(`Bits Server message Local Status Done Type ${doc_type} Id ${id}`);
                        }
                    }
                    return res.status(erpResponse.status).json({
                        status: "E",
                        httpstatus: erpResponse.status,
                        errors: erpResponse.data
                    });
                }

                // Handle approval
                const checkApprove = await handleApproveAction(
                    client, nextrole, nextroledesig, action, reciverrole, 
                    pin, processid, doc_type, finalDocId, finalProjectCode, sender
                );

                if (checkApprove) {
                    let result;
                    if (doc_type === 'admission') {
                        if (flag != 1) {
                            result = {
                                status: "CUSTMSG",
                                title: "অনুমোদন-",
                                message: "অভিনন্দন! প্রোফাইল আপডেট রিকুয়েস্ট সফলভাবে অনুমোদন হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
                            };
                        } else {
                            result = {
                                status: "CUSTMSG",
                                title: "অনুমোদন-",
                                message: "অভিনন্দন! ভর্তি আবেদন সফলভাবে অনুমোদন হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
                            };
                        }
                    } else {
                        result = {
                            status: "CUSTMSG",
                            title: "অনুমোদন-",
                            message: "অভিনন্দন! লোনের আবেদন সফলভাবে অনুমোদন করা হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন。"
                        };
                    }

                    return res.json(result);
                }
            }
        }
    } catch (err) {
        console.error('Error in document_manager:', err);
        return res.status(500).json({
            status: 'E',
            message: err.message
        });
    } finally {
        client.release();
    }
};

