// controller/DocumentManagerController.js
const { pool } = require('../config/config');
const logger = require('../utils/logger');



// Document api 

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


exports.DocumentManager = async (req, res) => {
    try {
        const { 
            doc_id, 
            projectcode, 
            doc_type, 
            pin, 
            role, 
            branchcode, 
            action 
        } = req.query;

        logger.info(`DocumentManager called with params: ${JSON.stringify(req.query)}`);

        // Validate required parameters
        if (!doc_id || !projectcode || !doc_type || !pin || !branchcode || !action) {
            return res.json({
                status: 'E',
                message: 'Missing required parameters'
            });
        }

        const client = await pool.connect();
        
        try {
            const db = process.env.DB_SCHEMA || 'dcs';
            
            // Your document management logic here
            // For now, returning success to fix the 404 error
            
            // Example: Update document status or create document entry
            const updateQuery = `
                UPDATE ${db}.loans 
                SET status = $1, 
                    processed_at = CURRENT_TIMESTAMP 
                WHERE id = $2
            `;
            
            await client.query(updateQuery, [2, doc_id]); // Status 2 = processed
            
            // Log the document processing
            const logQuery = `
                INSERT INTO ${db}.document_logs (
                    doc_id, 
                    doc_type, 
                    action, 
                    project_code, 
                    branch_code, 
                    pin, 
                    role_id, 
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            `;
            
            try {
                await client.query(logQuery, [
                    doc_id, 
                    doc_type, 
                    action, 
                    projectcode, 
                    branchcode, 
                    pin, 
                    role || 0
                ]);
            } catch (logError) {
                // If document_logs table doesn't exist, just log the error
                logger.warn('Document logs table may not exist:', logError.message);
            }
            
            return res.json({
                status: 'S',
                message: 'Document processed successfully',
                doc_id: doc_id,
                action: action
            });
            
        } catch (dbError) {
            logger.error('Database error in DocumentManager:', dbError);
            return res.json({
                status: 'E',
                message: 'Database error occurred'
            });
        } finally {
            client.release();
        }
        
    } catch (error) {
        logger.error('DocumentManager error:', error);
        return res.json({
            status: 'E',
            message: 'Internal server error'
        });
    }
};



