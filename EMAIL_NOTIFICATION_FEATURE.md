# Email Notification Feature for Action Plan Assignments

## Overview

This feature automatically sends email notifications to users when they are assigned action plans by HODs or admins. The emails include action plan details and a direct link to view the assigned action plans.

## Features

- **Automatic Email Notifications**: Sends emails when action plans are created or reassigned
- **Professional Email Templates**: HTML and text versions with company branding
- **Direct Links**: Includes clickable links to view action plans
- **Error Handling**: Email failures don't break the main functionality
- **Configurable**: Supports multiple email providers (Gmail, SMTP, etc.)

## How It Works

### 1. Action Plan Creation
When an HOD or admin creates a new action plan:
- The system saves the action plan to the database
- Fetches the assigned user's details (name, email)
- Sends an email notification to the assigned user
- Logs the email sending status

### 2. Action Plan Reassignment
When an HOD or admin updates an action plan and changes the assigned user:
- The system detects the assignment change
- Sends an email notification to the newly assigned user
- Logs the email sending status

### 3. Email Content
Each email includes:
- Personalized greeting with the user's name
- Action plan details (expectations, instructions, target date, status)
- Direct link to view action plans
- Contact information for questions
- Professional styling and branding

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Client URL for email links
CLIENT_URL=http://localhost:3000
```

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Use the App Password** in your `EMAIL_PASSWORD` environment variable

### SMTP Setup (Recommended for Production)

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Testing

### Test Email Configuration

Use the admin endpoint to test your email configuration:

```bash
GET /api/v1/action-plans/test-email
```

This endpoint:
- Verifies your email configuration
- Tests the connection to your email provider
- Returns success/error status

### Manual Testing

1. **Configure Email Settings**: Add the required environment variables
2. **Restart Server**: Restart your Node.js server to load new environment variables
3. **Test Configuration**: Use the test endpoint to verify email setup
4. **Create Action Plan**: Create an action plan as an HOD to trigger email
5. **Check Email**: Verify the assigned user receives the email

## Email Template

The email uses a responsive HTML template with:
- Professional header with gradient background
- Action plan details in a structured format
- Call-to-action button to view action plans
- Company branding and footer
- Fallback text version for email clients that don't support HTML

## Error Handling

- **Email Failures Don't Break Functionality**: If email sending fails, the action plan is still created/updated
- **Comprehensive Logging**: All email attempts are logged with success/error details
- **Graceful Degradation**: The system continues to work even if email is not configured

## Security Considerations

- **App Passwords**: Use app passwords instead of regular passwords for Gmail
- **Environment Variables**: Keep email credentials in environment variables, never in code
- **Access Control**: Email test endpoint is restricted to admin users only
- **No Sensitive Data**: Emails don't contain sensitive information beyond what's already visible in the app

## Production Recommendations

### Email Service Providers

For production, consider using dedicated email services:

1. **SendGrid**: Reliable, scalable, good deliverability
2. **AWS SES**: Cost-effective, integrates well with AWS
3. **Mailgun**: Developer-friendly, good API
4. **Postmark**: Excellent deliverability, focused on transactional emails

### Configuration Example (SendGrid)

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourcompany.com
```

### Monitoring

- Monitor email delivery rates
- Set up alerts for email failures
- Track email open rates and click-through rates
- Monitor spam complaints

## Troubleshooting

### Common Issues

1. **"Invalid login" Error**:
   - Check if you're using an app password (not regular password)
   - Verify 2-factor authentication is enabled

2. **"Connection timeout" Error**:
   - Check your internet connection
   - Verify SMTP host and port settings
   - Check firewall settings

3. **"Authentication failed" Error**:
   - Verify email and password are correct
   - Check if the email service requires special authentication

4. **Emails not being sent**:
   - Check server logs for email errors
   - Verify environment variables are loaded
   - Test email configuration using the test endpoint

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
DEBUG_EMAIL=true
```

This will log detailed email sending information to help troubleshoot issues.

## API Endpoints

### Test Email Configuration
- **URL**: `GET /api/v1/action-plans/test-email`
- **Access**: Admin only
- **Purpose**: Test email configuration and connectivity

### Response Format
```json
{
  "message": "Email configuration is valid",
  "success": true
}
```

## Future Enhancements

Potential improvements for the email notification feature:

1. **Email Templates**: Allow customization of email templates
2. **Email Preferences**: Let users opt-in/out of email notifications
3. **Scheduled Emails**: Send reminder emails for upcoming deadlines
4. **Email Analytics**: Track email open rates and engagement
5. **Multiple Languages**: Support for different languages
6. **Rich Content**: Include charts, graphs, or other visual elements
7. **Email Threading**: Group related action plan emails in threads 