const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config'); // Assuming you have this config file
const logger = require('../utils/logger'); // Assuming you have this logger utility









// exports. admission_store = async (req, res, next) => {
//  res.send("Hello from admission!");
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

exports.LoanRcaDataStore = async (req, res, next) => {
    const client = await pool.connect(); // Get a client from the connection pool
    try {
        /** Validation start */
        const validatorResult = getValidated(req.body);

        if (typeof validatorResult === 'string') {
            return res.status(400).json({ status: 'E', message: validatorResult });
        }
        /** Validation end */

        laravelLogService(); // Call the logging service

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const json = req.body.json;
        console.log('Loan Rca Data:', json); // Using console.log for logging

        const dataset = JSON.parse(json);
        const data = dataset.loan[0];
        const dataRca = dataset.rca[0];
        let projectcode = String(data.project_code).padStart(3, "0");
        const token = req.body.token; // Assuming token is directly in req.body

        if (token !== '7f30f4491cb4435984616d1913e88389') {
            return res.status(401).json(exceptionMessageService("Token Invalid"));
        }

        let branchcode = String(data.branch_code).padStart(4, "0");

        const checkpoint = await checkpointLoanService(client, data.vo_code, data.pin, data.erp_mem_id, branchcode, data.orgmemno, data.loan_id, projectcode, data.mem_id);

        if (checkpoint !== 'success') {
            return res.status(400).json(checkpoint); // Checkpoint service should return a proper error object if not 'success'
        }

        if (!data.orgmemno) {
            return res.status(400).json({ status: 'E', message: "দয়া করে প্রথম পেজে সিঙ্ক করে তারপরে আবার ট্রাই করুন।" });
        }

        let roleid = 0;
        let reciverrole = 1;
        const status = 1;
        const orgno = data.vo_code;
        const loanid = data.loan_id;
        const pin = data.pin;
        const assignedpo = data.pin;
        const mem_id = data.mem_id;
        const loan_product = data.loan_product;
        const loan_duration = data.loan_duration;
        const invest_sector = data.invest_sector;
        const scheme = data.scheme;
        const propos_amt = data.propos_amt;
        const instal_amt = data.instal_amt;
        const bracloan_family = data.bracloan_family;
        const vo_leader = data.vo_leader;
        const recommender = data.recommender;
        const grntor_name = data.grntor_name;
        const grntor_phone = data.grntor_phone;
        const grntor_rlationClient = data.grntor_rlationClient;
        const grntor_nid = data.grntor_nid;
        const witness_knows = data.witness_knows;
        const residence_type = data.residence_type;
        const residence_duration = data.residence_duration;
        const houseowner_knows = data.houseowner_knows ?? null;
        const reltive_presAddress = data.reltive_presAddress;
        const reltive_name = data.reltive_name;
        const reltive_phone = data.reltive_phone;
        const insurn_type = data.insurn_type;
        const insurn_option = data.insurn_option;
        const insurn_spouseName = data.insurn_spouseName;
        const insurn_spouseNid = data.insurn_spouseNid;
        const insurn_spouseDob = data.insurn_spouseDob;
        const insurn_gender = data.insurn_gender;
        const insurn_relation = data.insurn_relation;
        const insurn_name = data.insurn_name;
        const insurn_dob = data.insurn_dob;
        const insurn_mainID = data.insurn_mainID;
        const grantor_nidfront_photo = data.grantor_nidfront_photo;
        const grantor_nidback_photo = data.grantor_nidback_photo;
        const grantor_photo = data.grantor_photo;
        const erp_mem_id = data.erp_mem_id;
        const memberTypeId = data.memberTypeId;
        const subSectorId = data.subSectorId;
        const frequencyId = data.frequencyId;
        const insurn_mainIDType = data.insurn_mainIDType;
        const insurn_id_expire = data.insurn_id_expire;
        const insurn_placeofissue = data.insurn_placeofissue;
        const dynamicfieldvalueLoan = data.extra || null;
        const surveyid = data.surveyid;
        const orgmemno = data.orgmemno;
        const amount_inword = data.amount_inword;
        const loan_purpose = data.loan_purpose;
        const loan_user = data.loan_user;
        let loan_type = data.loan_type;
        let brac_loancount = data.brac_loancount;
        const approval_amount = data.propos_amt;
        const premium_amount = data.premium_amount ?? null;
        const savings_selected_Items = data.savings_selected_Items ? JSON.stringify(JSON.parse(data.savings_selected_Items)) : null;
        const passbook_required = data.passbook_required ?? null;
        const quotation_paper_Image = data.quotation_paper_Image ?? null;
        const prevLoanAmnt = data.prevLoanAmnt ?? null;
        const prevLoanDuration = data.prevLoanDuration ?? null;
        const profile_enrolment_id = data.profile_enrolment_id ?? null;
        const csi_insurer_name = data.csi_insurer_name ?? 0;

        const reciverrole_array = findHierarchyRoleService(0, projectcode);
        reciverrole = reciverrole_array[0];
        roleid = reciverrole - 1;

        const serverurlResult = serverURLService();
        if (typeof serverurlResult === 'string') {
            return res.status(500).json(serverurlResult);
        }
        const [urlindex, urlindex1] = serverurlResult;

        if (!urlindex && !urlindex1) {
            return res.status(500).json({ status: "CUSTMSG", message: "Api Url Not Found" });
        }

        const Memberurl = `${urlindex}MemberList?BranchCode=${branchcode}&ProjectCode=${projectcode}&CONo=${assignedpo}&OrgNo=${orgno}&OrgMemNo=${orgmemno}&key=5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae&Status=2`;

        const memberApiResponse = await axios.get(Memberurl);
        const memberData = memberApiResponse.data.data;

        if (memberData && memberData.length > 0) {
            if (memberData.length === 1) {
                const loan_type1 = memberData[0].LoanCycleNo;
                if (loan_type1 > 0) {
                    loan_type = 'Repeat';
                    brac_loancount = loan_type1;
                }
            }
        }

        await client.query('BEGIN'); // Start transaction

        const checkDataQuery = `SELECT id, loan_id FROM loans WHERE loan_id = $1`;
        const checkDataResult = await client.query(checkDataQuery, [loanid]);
        const checkData = checkDataResult.rows[0];
        const updatedate = moment().format('YYYY-MM-DD HH:mm:ss');
        let doc_id;

        if (!checkData) {
            const insertLoanQuery = `
                INSERT INTO loans (
                    mem_id, loan_product, loan_duration, invest_sector, propos_amt, instal_amt, bracloan_family,
                    vo_leader, recommender, grntor_name, grntor_phone, grntor_rlationClient, grntor_nid,
                    witness_knows, residence_type, residence_duration, houseowner_knows, reltive_presAddress,
                    reltive_name, reltive_phone, insurn_type, insurn_option, insurn_spouseName, insurn_spouseNid,
                    insurn_spouseDob, insurn_gender, insurn_relation, insurn_name, insurn_dob, insurn_mainID,
                    grantor_nidfront_photo, grantor_nidback_photo, grantor_photo, "DynamicFieldValue", projectcode,
                    branchcode, pin, roleid, reciverrole, status, loan_id, assignedpo, orgno, erp_mem_id, scheme,
                    "memberTypeId", "subSectorId", "frequencyId", "insurn_mainIDType", "insurn_id_expire",
                    "insurn_placeofissue", surveyid, amount_inword, loan_purpose, loan_user, loan_type,
                    brac_loancount, orgmemno, update_at, approval_amount, passbook_required, previous_loan_amt,
                    previous_loan_instlmnt, premium_amount, savings_selected_Items, quotation_paper_Image,
                    profile_enrolment_id, csi_insurer_name
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
                    $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56,
                    $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67
                ) RETURNING id`;

            const insertLoanValues = [
                mem_id, loan_product, loan_duration, invest_sector, propos_amt, instal_amt, bracloan_family,
                vo_leader, recommender, grntor_name, grntor_phone, grntor_rlationClient, grntor_nid,
                witness_knows, residence_type, residence_duration, houseowner_knows, reltive_presAddress,
                reltive_name, reltive_phone, insurn_type, insurn_option, insurn_spouseName, insurn_spouseNid,
                insurn_spouseDob, insurn_gender, insurn_relation, insurn_name, insurn_dob, insurn_mainID,
                grantor_nidfront_photo, grantor_nidback_photo, grantor_photo, dynamicfieldvalueLoan, projectcode,
                branchcode, pin, roleid, reciverrole, status, loanid, assignedpo, orgno, erp_mem_id, scheme,
                memberTypeId, subSectorId, frequencyId, insurn_mainIDType, insurn_id_expire,
                insurn_placeofissue, surveyid, amount_inword, loan_purpose, loan_user, loan_type,
                brac_loancount, orgmemno, updatedate, approval_amount, passbook_required, prevLoanAmnt,
                prevLoanDuration, premium_amount, savings_selected_Items, quotation_paper_Image,
                profile_enrolment_id, csi_insurer_name
            ];

            const result = await client.query(insertLoanQuery, insertLoanValues);
            doc_id = result.rows[0].id;
        } else {
            doc_id = checkData.id;
            const updateLoanQuery = `
                UPDATE loans SET
                    mem_id = $1, loan_product = $2, loan_duration = $3, invest_sector = $4, propos_amt = $5,
                    instal_amt = $6, bracloan_family = $7, vo_leader = $8, recommender = $9, grntor_name = $10,
                    grntor_phone = $11, grntor_rlationClient = $12, grntor_nid = $13, witness_knows = $14,
                    residence_type = $15, residence_duration = $16, houseowner_knows = $17, reltive_presAddress = $18,
                    reltive_name = $19, reltive_phone = $20, insurn_type = $21, insurn_option = $22,
                    insurn_spouseName = $23, insurn_spouseNid = $24, insurn_spouseDob = $25, insurn_gender = $26,
                    insurn_relation = $27, insurn_name = $28, insurn_dob = $29, insurn_mainID = $30,
                    grantor_nidfront_photo = $31, grantor_nidback_photo = $32, grantor_photo = $33,
                    "DynamicFieldValue" = $34, projectcode = $35, branchcode = $36, pin = $37, roleid = $38,
                    reciverrole = $39, status = $40, assignedpo = $41, orgno = $42, erp_mem_id = $43, scheme = $44,
                    "memberTypeId" = $45, "subSectorId" = $46, "frequencyId" = $47, "insurn_mainIDType" = $48,
                    "insurn_id_expire" = $49, "insurn_placeofissue" = $50, surveyid = $51, amount_inword = $52,
                    loan_purpose = $53, loan_user = $54, loan_type = $55, brac_loancount = $56, orgmemno = $57,
                    update_at = $58, approval_amount = $59, passbook_required = $60, previous_loan_amt = $61,
                    previous_loan_instlmnt = $62, premium_amount = $63, savings_selected_Items = $64,
                    quotation_paper_Image = $65, profile_enrolment_id = $66, csi_insurer_name = $67
                WHERE loan_id = $68`;

            const updateLoanValues = [
                mem_id, loan_product, loan_duration, invest_sector, propos_amt, instal_amt, bracloan_family,
                vo_leader, recommender, grntor_name, grntor_phone, grntor_rlationClient, grntor_nid,
                witness_knows, residence_type, residence_duration, houseowner_knows, reltive_presAddress,
                reltive_name, reltive_phone, insurn_type, insurn_option, insurn_spouseName, insurn_spouseNid,
                insurn_spouseDob, insurn_gender, insurn_relation, insurn_name, insurn_dob, insurn_mainID,
                grantor_nidfront_photo, grantor_nidback_photo, grantor_photo, dynamicfieldvalueLoan, projectcode,
                branchcode, pin, roleid, reciverrole, status, assignedpo, orgno, erp_mem_id, scheme,
                memberTypeId, subSectorId, frequencyId, insurn_mainIDType, insurn_id_expire,
                insurn_placeofissue, surveyid, amount_inword, loan_purpose, loan_user, loan_type,
                brac_loancount, orgmemno, updatedate, approval_amount, passbook_required, prevLoanAmnt,
                prevLoanDuration, premium_amount, savings_selected_Items, quotation_paper_Image,
                profile_enrolment_id, csi_insurer_name, loanid // The WHERE clause parameter
            ];
            await client.query(updateLoanQuery, updateLoanValues);
        }

        const primary_earner = dataRca.primary_earner ?? 1;
        const monthlyincome_main = dataRca.monthlyincome_main;
        const monthlyincome_other = dataRca.monthlyincome_other;
        const house_rent = dataRca.house_rent;
        const food = dataRca.food;
        const education = dataRca.education;
        const medical = dataRca.medical;
        const festive = dataRca.festive;
        const utility = dataRca.utility;
        const saving = dataRca.saving;
        const other = dataRca.other;
        const monthly_instal = dataRca.monthly_instal;
        const debt = dataRca.debt;
        const monthly_cash = dataRca.monthly_cash;
        const monthlyincome_spouse_child = dataRca.monthlyincome_spouse_child;
        const instal_proposloan = dataRca.instal_proposloan;
        const dynamicfieldvalueRca = dataRca.extra || null;
        const po_seasonal_income = dataRca.po_seasonal_income;
        const po_incomeformfixedassets = dataRca.po_incomeformfixedassets;
        const po_imcomeformsavings = dataRca.po_imcomeformsavings;
        const po_houseconstructioncost = dataRca.po_houseconstructioncost;
        const po_expendingonmarriage = dataRca.po_expendingonmarriage;
        const po_operation_childBirth = dataRca.po_operation_childBirth;
        const po_foreigntravel = dataRca.po_foreigntravel;

        if (!checkData) {
            const insertRcaQuery = `
                INSERT INTO rca (
                    loan_id, primary_earner, monthlyincome_main, monthlyincome_other, house_rent, food, education,
                    medical, festive, utility, saving, other, monthly_instal, debt, monthly_cash,
                    instal_proposloan, "DynamicFieldValue", monthlyincome_spouse_child, po_seasonal_income,
                    po_incomeformfixedassets, po_imcomeformsavings, po_houseconstructioncost,
                    po_expendingonmarriage, po_operation_childBirth, po_foreigntravel
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25
                )`;
            const insertRcaValues = [
                doc_id, primary_earner, monthlyincome_main, monthlyincome_other, house_rent, food, education,
                medical, festive, utility, saving, other, monthly_instal, debt, monthly_cash,
                instal_proposloan, dynamicfieldvalueRca, monthlyincome_spouse_child, po_seasonal_income,
                po_incomeformfixedassets, po_imcomeformsavings, po_houseconstructioncost,
                po_expendingonmarriage, po_operation_childBirth, po_foreigntravel
            ];
            await client.query(insertRcaQuery, insertRcaValues);
        } else {
            const updateRcaQuery = `
                UPDATE rca SET
                    primary_earner = $1, monthlyincome_main = $2, monthlyincome_other = $3, house_rent = $4,
                    food = $5, education = $6, medical = $7, festive = $8, utility = $9, saving = $10,
                    other = $11, monthly_instal = $12, debt = $13, monthly_cash = $14,
                    instal_proposloan = $15, "DynamicFieldValue" = $16, monthlyincome_spouse_child = $17,
                    po_seasonal_income = $18, po_incomeformfixedassets = $19, po_imcomeformsavings = $20,
                    po_houseconstructioncost = $21, po_expendingonmarriage = $22,
                    po_operation_childBirth = $23, po_foreigntravel = $24
                WHERE loan_id = $25`;
            const updateRcaValues = [
                primary_earner, monthlyincome_main, monthlyincome_other, house_rent, food, education,
                medical, festive, utility, saving, other, monthly_instal, debt, monthly_cash,
                instal_proposloan, dynamicfieldvalueRca, monthlyincome_spouse_child, po_seasonal_income,
                po_incomeformfixedassets, po_imcomeformsavings, po_houseconstructioncost,
                po_expendingonmarriage, po_operation_childBirth, po_foreigntravel, doc_id
            ];
            await client.query(updateRcaQuery, updateRcaValues);
        }

        await client.query('COMMIT'); // Commit transaction

        const document_url = `${baseUrl}/DocumentManager?doc_id=${doc_id}&projectcode=${projectcode}&doc_type=loan&pin=${pin}&role=0&branchcode=${branchcode}&action=Request`;
        console.log('Document_url :', document_url);

        const documentOutput = await axios.get(document_url);
        const collectionfordocument = documentOutput.data; // Assuming it returns JSON directly

        if (collectionfordocument.status === 'S') {
            const result = { status: "S", message: "অভিনন্দন! লোনের আবেদন সফলভাবে পাঠানো হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।" };

            const doc_type = 'loan';
            const entollmentid = data.loan_id;
            const action = 'Request';
            const command = 'sync';
            const actionstatus = 0;

            // Fetch member_name for notification
            const memberNameQuery = `SELECT a."ApplicantsName" FROM loans AS l JOIN admissions AS a ON l.erp_mem_id = a."MemberId" WHERE l.loan_id = $1`;
            const memberNameResult = await client.query(memberNameQuery, [entollmentid]);
            const member_name = memberNameResult.rows[0] ? memberNameResult.rows[0].ApplicantsName : null;

            const notification_info = {
                po_name: (liveApiIndividualGetPOService().find(po => true))?.coname ?? null, // Assuming first element if exists
                vo_code: orgno ?? null,
                member_name: member_name,
                member_code: data.orgmemno ?? null,
            };

            await createNotificationService(client, projectcode, doc_type, doc_id, entollmentid, pin, roleid, branchcode, action, assignedpo, command, actionstatus, erp_mem_id, reciverrole, notification_info, null);

            return res.status(200).json(result);
        } else {
            return res.status(500).json(collectionfordocument);
        }

    } catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error in LoanRcaDataStore:', error);
        return res.status(500).json({ status: 'E', message: error.message });
    } finally {
        client.release(); // Release the client back to the pool
    }
};

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

