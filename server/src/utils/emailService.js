import nodemailer from 'nodemailer';

// Create SMTP transporter for email sending
const createTransporter = () => {
  // Check if SMTP credentials are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_MAIL || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured - email notifications will be disabled');
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT) || 587;
  
  // Use a very simple configuration that's most compatible
  const config = {
    host: process.env.SMTP_HOST,
    port: port,
    secure: false, // Always use STARTTLS instead of SSL
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASS,
    },
    // Minimal TLS configuration
    tls: {
      rejectUnauthorized: false,
      // Don't specify versions to let the system negotiate
    },
    // Connection settings
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    // Disable pooling to avoid connection issues
    pool: false
  };

  console.log(`Creating email transporter for ${process.env.SMTP_HOST}:${port}`);
  return nodemailer.createTransport(config);
};

// Helper function to send email with retry logic
const sendEmailWithRetry = async (transporter, mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Email attempt ${attempt}/${maxRetries}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error; // Re-throw on final attempt
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Send action plan assignment email
export const sendActionPlanAssignmentEmail = async (assignedUser, actionPlan, assignedByUser) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('SMTP not configured - skipping action plan assignment notification');
      return { success: false, error: 'SMTP not configured' };
    }
    
    // Email template
    const emailSubject = `New Action Plan Assigned`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Action Plan Assignment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .action-plan { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Action Plan Assignment</h1>
            <p>Hello ${assignedUser.name},</p>
          </div>
          
          <div class="content">
            <p>You have been assigned a new action plan by <strong>${assignedByUser.name}</strong>.</p>
            
            <div class="action-plan">
              <h3>Action Plan Details:</h3>
              <p><strong>Expectations:</strong> ${actionPlan.expectations}</p>
              ${actionPlan.actionplan ? `<p><strong>Action Plan:</strong> ${actionPlan.actionplan}</p>` : ''}
              ${actionPlan.instructions ? `<p><strong>Instructions:</strong> ${actionPlan.instructions}</p>` : ''}
              <p><strong>Target Date:</strong> ${new Date(actionPlan.targetDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">${actionPlan.finalStatus || actionPlan.status}</span></p>
            </div>
            
            <div class="highlight">
              <p><strong>⚠️ Important:</strong> Please review this action plan and update the status as you progress.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/action-plans" class="button">
                View Action Plans
              </a>
            </p>
            
            <p>If you have any questions about this assignment, please contact ${assignedByUser.name} or your department head.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the ICSQ Action Plan System.</p>
            <p>© ${new Date().getFullYear()} Sobha Realty. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const emailText = `
New Action Plan Assignment

Hello ${assignedUser.name},

You have been assigned a new action plan by ${assignedByUser.name}.

Action Plan Details:
- Expectations: ${actionPlan.expectations}
${actionPlan.actionplan ? `- Action Plan: ${actionPlan.actionplan}\n` : ''}${actionPlan.instructions ? `- Instructions: ${actionPlan.instructions}\n` : ''}- Target Date: ${new Date(actionPlan.targetDate).toLocaleDateString()}
- Status: ${actionPlan.finalStatus || actionPlan.status}

Please review this action plan and update the status as you progress.

View your action plans at: ${process.env.CLIENT_URL || 'http://localhost:5173'}/action-plans

If you have any questions about this assignment, please contact ${assignedByUser.name} or your department head.

This is an automated notification from the ICSQ Action Plan System.
    `;
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: assignedUser.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };
    
    return await sendEmailWithRetry(transporter, mailOptions);
    
  } catch (error) {
    console.error('Error sending action plan assignment email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, error: error.message };
  }
};

// Send action plan creation notification to original survey respondents
export const sendActionPlanCreatedNotification = async (respondentUser, actionPlan, departmentName, categoryName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('SMTP not configured - skipping action plan creation notification');
      return { success: false, error: 'SMTP not configured' };
    }
    
    // Email template
    const emailSubject = `Action Plan Created for Your Expectation`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Action Plan Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .action-plan { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .highlight { background: #d4edda; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745; }
          .expectation { background: #e9ecef; padding: 10px; border-radius: 5px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Action Plan Created for Your Expectation</h1>
            <p>Hello ${respondentUser.name},</p>
          </div>
          
          <div class="content">
            <p>Great news! <strong>${departmentName.split(",")[0]}</strong> has started working on your feedback and has created an action plan to address it.</p>
            
            <div class="expectation">
              <h4>Your Expectation:</h4>
              <p>"${actionPlan.expectations}"</p>
            </div>
            
            <div class="action-plan">
              <h3>Action Plan Details:</h3>
              <p><strong>Categories :</strong> ${categoryName}</p>
              <p><strong>Concerned Departments:</strong> ${departmentName}</p>
              ${actionPlan.expectations ? `<p><strong>Expectations:</strong> ${actionPlan.expectations}</p>` : ''}
              <p><strong>Target Date:</strong> ${new Date(actionPlan.targetDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">${actionPlan.finalStatus || actionPlan.status}</span></p>
            </div>
            
            <div class="highlight">
              <p><strong>✅ What this means:</strong> The department has acknowledged your feedback and is taking concrete steps to address your expectation. You'll be notified when the status changes.</p>
            </div>

             <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="button">
                View
              </a>
            </p>
            
            <p>Thank you for your valuable feedback. We appreciate your input in helping us improve our services.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the ICSQ Action Plan System.</p>
            <p>© ${new Date().getFullYear()} Sobha Realty. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const emailText = `
Action Plan Created for Your Expectation

Hello ${respondentUser.name},

Great news! ${departmentName} has started working on your expectation and has created an action plan to address it.

Your Original Expectation:
"${actionPlan.expectations}"

Action Plan Details:
- Categories: ${categoryName}
- Concerned Departments: ${departmentName}
${actionPlan.instructions ? `- Instructions: ${actionPlan.instructions}\n` : ''}- Target Date: ${new Date(actionPlan.targetDate).toLocaleDateString()}
- Status: ${actionPlan.finalStatus || actionPlan.status}

What this means: The department has acknowledged your feedback and is taking concrete steps to address your expectation. You'll be notified when the status changes.

View your action plans at: ${process.env.CLIENT_URL || 'http://localhost:5173'}/action-plans

Thank you for your valuable feedback. We appreciate your input in helping us improve our services.

This is an automated notification from the ICSQ Action Plan System.
    `;
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: respondentUser.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };
    
    return await sendEmailWithRetry(transporter, mailOptions);
    
  } catch (error) {
    console.error('Error sending action plan creation notification:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, error: error.message };
  }
};


// Send final status change notification to original survey respondents
export const sendFinalStatusChangeNotification = async (respondentUser, actionPlan, departmentName, categoryName, oldFinalStatus, newFinalStatus) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('SMTP not configured - skipping final status change notification');
      return { success: false, error: 'SMTP not configured' };
    }
    
    // Status color mapping
    const statusColors = {
      'pending': '#dc3545',
      'in-progress': '#ffc107',
      'completed': '#28a745'
    };
    
    // Email template
    const emailSubject = `Action Plan Status Updated - ${categoryName}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Action Plan Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .action-plan { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .highlight { background: #d4edda; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745; }
          .status-change { background: #e9ecef; padding: 10px; border-radius: 5px; text-align: center; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
          .final-status { background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Action Plan Status Update</h1>
            <p>Hello ${respondentUser.name},</p>
          </div>
          
          <div class="content">
            <p>The <strong>status</strong> of the action plan created for your expectation has been updated by the department head.</p>
            
            <div class="status-change">
              <p><strong>Status Change:</strong></p>
              <p>
                <span class="status-badge" style="background-color: ${statusColors[oldFinalStatus] || '#6c757d'};">${oldFinalStatus ? oldFinalStatus.toUpperCase() : 'PENDING'}</span>
                <span style="margin: 0 10px;">→</span>
                <span class="status-badge" style="background-color: ${statusColors[newFinalStatus] || '#6c757d'};">${newFinalStatus.toUpperCase()}</span>
              </p>
            </div>
            
            <div class="overall-status">
              <p><strong>🏆 Status:</strong> This is the official completion status determined by the department head. When marked as completed, it means the action plan has been fully implemented and your expectation has been addressed.</p>
            </div>
            
            <div class="action-plan">
              <h3>Action Plan Details:</h3>
              <p><strong>Your Expectation:</strong> "${actionPlan.expectations}"</p>
              <p><strong>Category:</strong> ${categoryName}</p>
              <p><strong>Concerned Departments:</strong> ${departmentName}</p>
              ${actionPlan.actionplan ? `<p><strong>Action Plan:</strong> ${actionPlan.actionplan}</p>` : ''}
              ${actionPlan.instructions ? `<p><strong>Instructions:</strong> ${actionPlan.instructions}</p>` : ''}
              <p><strong>Target Date:</strong> ${new Date(actionPlan.targetDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColors[newFinalStatus] || '#6c757d'}; font-weight: bold;">${newFinalStatus.toUpperCase()}</span></p>
            </div>
            
            <div class="highlight">
              <p><strong>📈 What this means:</strong> 
              ${newFinalStatus === 'in-progress' ? 'The department has officially started working on your expectation and progress is being made.' : 
                newFinalStatus === 'completed' ? '🎉 Excellent! The action plan for your expectation has been officially completed by the department. Your feedback has been successfully addressed!' :
                'The action plan is being reviewed and prepared by the department.'}
              </p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/action-plans" class="button">
                View Action Plans
              </a>
            </p>
            
            <p>Thank you for your valuable feedback. We appreciate your input in helping us improve our services.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the ICSQ Action Plan System.</p>
            <p>© ${new Date().getFullYear()} Sobha Realty. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const emailText = `
Action Plan Status Update

Hello ${respondentUser.name},

The status of the action plan created for your expectation has been updated by the department head.

Status Change: ${oldFinalStatus ? oldFinalStatus.toUpperCase() : 'PENDING'} → ${newFinalStatus.toUpperCase()}

Status: This is the official completion status determined by the department head. When marked as completed, it means the action plan has been fully implemented and your expectation has been addressed.

Action Plan Details:
- Your Expectation: "${actionPlan.expectations}"
- Category: ${categoryName}
- Department: ${departmentName}
${actionPlan.actionplan ? `- Action Plan: ${actionPlan.actionplan}\n` : ''}${actionPlan.instructions ? `- Instructions: ${actionPlan.instructions}\n` : ''}- Target Date: ${new Date(actionPlan.targetDate).toLocaleDateString()}
- Status: ${newFinalStatus.toUpperCase()}

What this means: 
${newFinalStatus === 'in-progress' ? 'The department has officially started working on your expectation and progress is being made.' : 
  newFinalStatus === 'completed' ? 'Excellent! The action plan for your expectation has been officially completed by the department. Your feedback has been successfully addressed!' :
  'The action plan is being reviewed and prepared by the department.'}

View Action Plans at: ${process.env.CLIENT_URL || 'http://localhost:5173'}/action-plans

Thank you for your valuable feedback. We appreciate your input in helping us improve our services.

This is an automated notification from the ICSQ Action Plan System.
    `;
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: respondentUser.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };
    
    return await sendEmailWithRetry(transporter, mailOptions);
    
  } catch (error) {
    console.error('Error sending final status change notification:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }
    
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP configuration is valid');
    
    // Test sending a simple email
    const testMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Send to self for testing
      subject: 'ICSQ Email Configuration Test',
      text: 'This is a test email to verify the email configuration is working correctly.',
      html: '<p>This is a test email to verify the email configuration is working correctly.</p>'
    };
    
    const result = await sendEmailWithRetry(transporter, testMailOptions);
    return result;
  } catch (error) {
    console.error('SMTP configuration error:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, error: error.message };
  }
};

// Send action plan creation confirmation email to HOD
export const sendActionPlanCreationConfirmationEmail = async (hodUser, actionPlan, assignedUsers, departmentNames, categoryNames) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('SMTP not configured - skipping action plan creation confirmation notification');
      return { success: false, error: 'SMTP not configured' };
    }
    
    // Email template
    const emailSubject = `Action Plan Created Successfully.`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Action Plan Creation Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .action-plan { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745; }
          .assigned-users { background: #e3f2fd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2196f3; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .highlight { background: #d4edda; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Action Plan Created Successfully</h1>
            <p>Hello ${hodUser.name},</p>
          </div>
          
          <div class="content">
            <p>Your action plan has been created and assigned successfully!</p>
            
            <div class="action-plan">
              <h3>Action Plan Details:</h3>
              <p><strong>Expectations:</strong> ${actionPlan.expectations}</p>
              <p><strong>Action Plan:</strong> ${actionPlan.actionplan}</p>
              ${actionPlan.instructions ? `<p><strong>Instructions:</strong> ${actionPlan.instructions}</p>` : ''}
              <p><strong>Target Date:</strong> ${new Date(actionPlan.targetDate).toLocaleDateString()}</p>
              <p><strong>Concerned Departments:</strong> ${departmentNames.join(', ')}</p>
              <p><strong>Categories:</strong> ${categoryNames.join(', ')}</p>
            </div>
            
            <div class="assigned-users">
              <h3>Assigned Users (${assignedUsers.length}):</h3>
              <ul>
                ${assignedUsers.map(user => `<li>${user.name} (${user.email})</li>`).join('')}
              </ul>
            </div>
            
            
            <div class="highlight">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>All assigned users have been notified via email</li>
                <li>You can monitor progress through ICSQ dashboard</li>
                <li>Users can update their status and actions taken</li>
              </ul>
            </div>
            
            <p>Thank you for using the ICSQ Action Plan system!</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the ICSQ Action Plan System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `"ICSQ Action Plan System" <${process.env.SMTP_MAIL}>`,
      to: hodUser.email,
      subject: emailSubject,
      html: emailHtml
    };
    
    return await sendEmailWithRetry(transporter, mailOptions);
  } catch (error) {
    console.error('Error sending action plan creation confirmation email:', {
      error: error.message,
      stack: error.stack,
      hodUser: hodUser?.email,
      actionPlanId: actionPlan?._id
    });
    return { success: false, error: error.message };
  }
}; 