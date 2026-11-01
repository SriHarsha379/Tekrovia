
# TekRovia — Client Requirements Checklist
## What We Need From You to Go Live

---

### Where We Are Today

The TekRovia platform is **fully built and ready to demo**. Every screen a 
student and admin will use is complete — learning, assessments, projects, 
placement tracking, support tickets, AI features and the admin portal.

What's left is connecting the platform to external services that require 
business accounts. These are all third-party providers — none of them need 
additional development work from us. Once you provide the credentials, each 
integration is a 1-2 day wire-up.

---

### ✅ Already Done (No Action Needed From You)

- Complete student portal (10 screens)
- Complete admin portal (6 screens)  
- All backend APIs
- Database with full data model
- AI service (roadmap, mock interview, resume review, doubt assistant)
- Placement pipeline and readiness gate
- Support ticket system with SLA timers
- Marketing funnel dashboard
- Batch and course management

---

### 📋 What We Need From You

---

#### 1. 💳 Razorpay — Online Payments
**What it unlocks:** Students can pay for courses online. Currently payments 
are taken offline and admin manually enrolls students.

**What you need to provide:**
- Razorpay Account (business account at razorpay.com)
- Razorpay Key ID
- Razorpay Key Secret

**How to get it:**
1. Sign up at razorpay.com with your business PAN and bank account
2. Complete KYC verification (takes 1-3 business days)
3. Go to Settings → API Keys → Generate Key
4. Share the Key ID and Key Secret with us

**Estimated setup time once we have keys:** 2-3 days

---

#### 2. 📱 OTP Delivery — SMS Provider
**What it unlocks:** Students can actually log in. Currently OTP login only 
works in development mode. Without this, no real user can log into the platform.

**This is the most critical item — nothing works in production without it.**

**What you need to provide:**
- An account with one of these providers:
  - **MSG91** (recommended for India) — msg91.com
  - **Fast2SMS** — fast2sms.com
  - **Twilio** — twilio.com
- API Key from the provider
- Sender ID approved by TRAI (for Indian SMS)

**How to get it (MSG91 recommended):**
1. Sign up at msg91.com
2. Add credits (minimum ₹500 to start)
3. Register a Sender ID (e.g. TKRVIA) — takes 3-7 days for TRAI approval
4. Go to API → Generate API Key
5. Share the API key and Sender ID with us

**Estimated setup time once we have keys:** 1 day

---

#### 3. 📧 Email Delivery — Transactional Email
**What it unlocks:** 
- OTP via email (backup to SMS)
- Welcome emails after registration
- Invoice emails after payment
- Assignment feedback notifications
- Placement update emails

**What you need to provide:**
- A domain name (e.g. tekrovia.com) — see item 7
- An account with one of these providers:
  - **Resend** (recommended) — resend.com
  - **SendGrid** — sendgrid.com
  - **AWS SES** — if you already use AWS
- API Key from the provider
- A sending email address (e.g. noreply@tekrovia.com)

**How to get it (Resend recommended):**
1. Sign up at resend.com (free tier available)
2. Add and verify your domain (requires DNS access)
3. Go to API Keys → Create API Key
4. Share the API key and sending email with us

**Estimated setup time once we have keys:** 1 day

---

#### 4. 💬 WhatsApp Business — Automation
**What it unlocks:**
- Welcome message after registration
- Session reminders during trial
- Payment link after trial
- Onboarding messages after enrollment
- Inactivity nudges
- Mock interview reminders

**What you need to provide:**
- A dedicated WhatsApp Business number (cannot be a personal number)
- An account with one of these providers:
  - **WATI** (recommended for India) — wati.io
  - **Interakt** — interakt.shop
  - **Gupshup** — gupshup.io
- API Key from the provider
- Message templates approved by Meta (we will write these for you)

**How to get it (WATI recommended):**
1. Sign up at wati.io
2. Connect your WhatsApp Business number
3. Submit message templates for Meta approval (takes 1-3 days per template)
4. Share the API key and endpoint URL with us

**Important:** Meta requires pre-approved templates for outbound messages. 
We will prepare the template content — you just need to submit them for 
approval. Plan for 1-2 weeks for this process.

**Estimated setup time once we have keys + approvals:** 2-3 days

---

#### 5. 🤖 OpenAI — AI Features
**What it unlocks:**
- Personalised career roadmap generation
- AI mock interview question generation
- Resume ATS review and scoring
- Lesson doubt assistant

**What you need to provide:**
- OpenAI account at platform.openai.com
- OpenAI API Key
- Billing set up (pay-per-use — typically ₹500-2000/month at launch scale)

**How to get it:**
1. Sign up at platform.openai.com
2. Go to Billing → Add payment method
3. Go to API Keys → Create new secret key
4. Share the API key with us

**Recommended model:** GPT-4o Mini (cost-effective, fast, high quality)

**Estimated setup time once we have keys:** Same day

---

#### 6. 🎥 Video Hosting — Course Videos
**What it unlocks:** Secure, protected video delivery for course lessons. 
Currently videos can be linked but are not protected — anyone with the URL 
can watch without being enrolled.

**What you need to provide:**
- An AWS account (aws.amazon.com) OR
- A Cloudflare Stream account (cloudflare.com/products/cloudflare-stream)
- S3 bucket name and region (if AWS)
- CloudFront distribution URL (if AWS)
- Access Key ID and Secret (if AWS)
- A signing secret for URL protection

**How to get it (AWS recommended):**
1. Create an AWS account
2. Create an S3 bucket for video storage
3. Set up CloudFront distribution in front of S3
4. Enable signed URLs on CloudFront
5. Share the distribution URL, bucket name and signing key with us

**Note:** Video upload and encoding is a separate concern — we can discuss 
a workflow for uploading course videos once this is set up.

**Estimated setup time once we have credentials:** 2-3 days

---

#### 7. 🌐 Domain Name
**What it unlocks:** A real URL for the platform (e.g. tekrovia.com or 
app.tekrovia.com), professional email sending, and SSL certificate.

**What you need to provide:**
- A registered domain name
- Access to DNS settings (to add records we specify)

**How to get it:**
- Register at GoDaddy, Namecheap, or Google Domains
- Recommended: tekrovia.com or learnwithtekrovia.com

**Estimated setup time once we have DNS access:** Same day

---

#### 8. 🚀 Hosting — Production Deployment
**What it unlocks:** The platform running on real servers accessible to 
students and admins.

**Recommended setup (cost-effective for launch):**

| Service | What it hosts | Estimated cost |
|---|---|---|
| Vercel | Next.js frontend | Free tier / ₹1,500/month |
| Railway or Render | NestJS API + PostgreSQL + Redis | ₹2,000-4,000/month |
| Railway or Render | FastAPI AI service | Included above |

**What you need to provide:**
- Preference between Railway and Render (or another provider)
- A credit card for the hosting account

**We will handle:** All deployment configuration, environment variables, 
database setup and CI/CD pipeline.

**Estimated setup time:** 1-2 days

---

### 📅 Suggested Timeline

Week 1 (You do):
□ Register domain
□ Sign up for Razorpay + start KYC
□ Sign up for MSG91 + register Sender ID
□ Sign up for Resend + verify domain
□ Sign up for OpenAI + add billing
□ Sign up for WATI + connect WhatsApp number
Week 2 (Parallel):
□ Razorpay KYC approved → share keys with us
□ OpenAI key ready → share with us (AI goes live same day)
□ Resend key ready → share with us (email goes live same day)
□ We begin WhatsApp template drafts → you submit to Meta
Week 3:
□ MSG91 Sender ID approved → share with us (OTP goes live)
□ Set up AWS / Cloudflare for video
□ Choose and set up hosting
□ We deploy to production
Week 4:
□ Meta WhatsApp templates approved → automation goes live
□ Full platform live on domain
□ First cohort onboarding

---

### 💰 Estimated Monthly Running Costs at Launch

| Service | Cost |
|---|---|
| Hosting (Railway/Render) | ₹2,000 - 4,000 |
| OpenAI (AI features) | ₹500 - 2,000 |
| MSG91 (OTP SMS) | ₹200 - 500 |
| Resend (Email) | Free - ₹1,000 |
| WATI (WhatsApp) | ₹3,000 - 6,000 |
| Domain renewal | ₹100/month |
| **Total** | **₹6,000 - 14,000/month** |

Costs scale with usage. At 100 active students, expect the lower end.

---

### 📞 What Happens Next

1. Share this document with your team
2. Start the sign-up processes in Week 1 — several have waiting periods
3. Share credentials with us as they become available — we integrate each 
   one as it arrives, no need to wait for everything
4. We can go live partially — e.g. with email + OTP before WhatsApp is ready

Questions? Raise them early — the TRAI Sender ID and Meta WhatsApp template 
approvals are the longest-lead items and should be started immediately.

---

*Prepared by the TekRovia development team — November 2026*
*Platform version: 0.2.0 — Feature complete, pending client integrations*x