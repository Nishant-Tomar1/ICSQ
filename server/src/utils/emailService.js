import nodemailer from 'nodemailer';

// Create transporter for email sending
const createTransporter = () => {
  // For development/testing, you can use Gmail or other services
  // For production, you might want to use services like SendGrid, AWS SES, etc.
  
  // Gmail configuration (for development)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
      },
    });
  }
  
  // SMTP configuration (for production)
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Send action plan assignment email
export const sendActionPlanAssignmentEmail = async (assignedUser, actionPlan, assignedByUser) => {
  try {
    const transporter = createTransporter();
    
    // Email template
    const emailSubject = `New Action Plan Assigned - ${actionPlan.expectations.substring(0, 50)}...`;
    
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
              ${actionPlan.instructions ? `<p><strong>Instructions:</strong> ${actionPlan.instructions}</p>` : ''}
              <p><strong>Target Date:</strong> ${new Date(actionPlan.targetDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">${actionPlan.status}</span></p>
            </div>
            
            <div class="highlight">
              <p><strong>⚠️ Important:</strong> Please review this action plan and update the status as you progress.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/action-plans" class="button">
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
${actionPlan.instructions ? `- Instructions: ${actionPlan.instructions}\n` : ''}- Target Date: ${new Date(actionPlan.targetDate).toLocaleDateString()}
- Status: ${actionPlan.status}

Please review this action plan and update the status as you progress.

View your action plans at: ${process.env.CLIENT_URL || 'http://localhost:3000'}/action-plans

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
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Action plan assignment email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending action plan assignment email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return { success: true };
  } catch (error) {
    console.error('Email configuration error:', error);
    return { success: false, error: error.message };
  }
}; 