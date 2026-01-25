# Razorpay Test Mode Setup Guide

This guide will help you configure Razorpay test mode payments for the Repa platform.

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com)
2. Access to Razorpay Dashboard

## Step 1: Get Test Mode API Keys

1. **Log in to Razorpay Dashboard**: https://dashboard.razorpay.com
2. **Switch to Test Mode**: 
   - Look for a toggle/switch in the top right corner
   - Switch from "Live" to "Test" mode
   - The interface will show "Test Mode" indicator

3. **Get API Keys**:
   - Go to **Settings** → **API Keys**
   - Click **Generate Test Keys** if you haven't already
   - Copy your **Key ID** and **Key Secret**

## Step 2: Configure Environment Variables

Add the following to your `.env` file in the project root:

```bash
# Razorpay Test Mode Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx  # Your Test Key ID
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx  # Your Test Key Secret
```

**Important**: 
- Never commit these keys to version control
- Use test keys only in development
- For production, use live mode keys

## Step 3: Test Payment Flow

### Using Test Cards

Razorpay provides test card numbers for testing:

#### Successful Payment
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name

#### Failed Payment
- **Card Number**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

#### Other Test Scenarios
- **Card declined**: `4000 0000 0000 0069`
- **Insufficient funds**: `4000 0000 0000 9995`
- **3D Secure**: `4012 0010 3714 1112`

### Testing the Integration

1. **Start your Express.js server**:
   ```bash
   npm run dev
   ```

2. **Navigate to an event with payment** in your application

3. **Click "Register"** and proceed to payment

4. **Use test card details** above

5. **Verify payment**:
   - Check Razorpay Dashboard → **Payments** → **Test Mode**
   - Payment should appear with status "Captured"

## Step 4: Verify Webhook Configuration (Optional)

For production, you'll need to configure webhooks:

1. Go to **Settings** → **Webhooks** in Razorpay Dashboard
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy the webhook secret

Add to `.env`:
```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Common Issues and Solutions

### Issue: "Payment gateway not configured"
**Solution**: 
- Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env`
- Restart your server after adding environment variables

### Issue: "Invalid key"
**Solution**:
- Verify you're using **Test Mode** keys (start with `rzp_test_`)
- Check for extra spaces or quotes in `.env` file
- Ensure keys are copied completely

### Issue: Payment succeeds but registration doesn't update
**Solution**:
- Check webhook configuration
- Verify webhook endpoint is accessible
- Check server logs for webhook errors

### Issue: "Order creation failed"
**Solution**:
- Verify Razorpay instance is initialized correctly
- Check network connectivity
- Ensure amount is in paise (multiply by 100)

## Current Configuration

The codebase includes a default test Key ID as fallback: `rzp_test_S80fwkNsAjSEZ6`

**Important**: Always use your own keys in production. Update the `.env` file:
```bash
RAZORPAY_KEY_ID=rzp_test_S80fwkNsAjSEZ6
RAZORPAY_KEY_SECRET=O59kU61NKA7YRlkZoKrBOt33
```

Copy `.env.example` to `.env` and update with your actual keys.

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Use test mode** for development
4. **Switch to live mode** only in production
5. **Rotate keys** periodically
6. **Monitor transactions** in Razorpay Dashboard

## Testing Checklist

- [ ] Test mode enabled in Razorpay Dashboard
- [ ] Test API keys added to `.env`
- [ ] Server restarted after adding keys
- [ ] Test payment with successful card
- [ ] Test payment with failed card
- [ ] Verify payment appears in Razorpay Dashboard
- [ ] Check registration status updates after payment

## Support

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay Support**: support@razorpay.com
- **Test Mode Guide**: https://razorpay.com/docs/payments/test-cards/

## Production Deployment

When moving to production:

1. **Switch to Live Mode** in Razorpay Dashboard
2. **Generate Live API Keys**
3. **Update environment variables** with live keys
4. **Configure production webhooks**
5. **Test with small amounts** first
6. **Enable payment notifications**

---

**Note**: The default Key ID `S4yrsJtpeiuw2a` in the code is a placeholder. Replace it with your actual test Key ID from Razorpay Dashboard.
