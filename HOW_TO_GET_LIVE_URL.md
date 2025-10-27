# 🔗 How to Get Your Live URL on Railway

## 📍 Where to Find Your Live Link

### Step-by-Step Instructions:

1. **Go to Railway Dashboard**: https://railway.app

2. **Select Your Service**:
   - Click on your project
   - You should see your service name
   - Click on it

3. **Look for "Settings" Tab**:
   - At the top of your service page
   - Click "Settings"

4. **Click "Network" or "Domains"**:
   - Look for "Network" tab
   - OR "Generate Domain" button
   - OR "Add Domain" button

5. **Generate Domain**:
   - Click "Generate Domain" button
   - Railway will create a URL like: `yourproject-production.up.railway.app`

---

## 🎯 If You Don't See the Button

### Option 1: Check Service Settings
- Your service might need to be set as "public"
- Go to Settings → General
- Make sure "Public" is enabled

### Option 2: Check Deployment Tab
- Look at the "Deployments" tab
- Click on the latest deployment
- Check if there's a URL there

### Option 3: Check Logs
- Look at the "Logs" tab
- Sometimes the URL is shown in the startup logs

---

## 🚨 Common Issue: "Deployed" but No URL

If you see "Deployed Service" but no link:

### This usually means:
1. Service is deployed ✅
2. But not exposing a public URL yet
3. OR the domain isn't configured

### Solution:
Go to Settings → Network → Generate Domain

---

## 📸 What You Should See

When you click "Generate Domain", you should see:
```
✅ Generated Domain
🌐 https://yourproject-production.up.railway.app
```

---

## ✅ Quick Checklist

- [ ] Open Railway Dashboard
- [ ] Click your service
- [ ] Click "Settings"
- [ ] Click "Network" or "Domains"
- [ ] Click "Generate Domain"
- [ ] Copy your URL
- [ ] Test the URL (it will show error without env vars, but it's there!)

---

## 🎯 Next Steps

Once you have the URL:
1. Note it down
2. Add it to your GOOGLE_REDIRECT_URI
3. Update environment variables
4. Redeploy
5. Your app will work!

---

**The URL exists, you just need to generate/activate it!** 🚀

