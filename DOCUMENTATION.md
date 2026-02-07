# 📚 Earist OJT Management System - Complete Documentation

> **Last Updated:** February 7, 2026  
> **System Version:** Production Ready  
> **Author:** Development Team

---

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Features & Modules](#features--modules)
4. [Security Features](#security-features)
5. [QR Code System](#qr-code-system)
6. [Deployment Guide](#deployment-guide)
7. [Backup & Maintenance](#backup--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

---

## 🎯 System Overview

The **Earist OJT Management System** is a comprehensive web-based platform designed to streamline the management of On-the-Job Training (OJT) programs. It connects students, coordinators, supervisors, and administrators in a unified ecosystem.

### Key Stakeholders

- **👨‍🎓 Students**: Apply for internships, track progress, submit reports
- **👔 Coordinators**: Manage students, approve requirements, monitor progress
- **👨‍💼 Supervisors**: Evaluate students, track attendance, provide feedback
- **⚙️ Administrators**: System configuration, user management, analytics

### Technology Stack

**Backend:**
- Django 4.2+ (Python)
- Django REST Framework
- SQLite Database (Development) / PostgreSQL (Production)
- JWT Authentication

**Frontend:**
- React 18+
- Axios for API calls
- CSS3 with modern animations
- Responsive design

---

## 🚀 Quick Start Guide

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Git

### Installation Steps

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Earist OJT"
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### 4. Access the Application
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Admin Panel: `http://localhost:8000/admin`

---

## 🎨 Features & Modules

### 1. Authentication & Security

#### Two-Factor Authentication (2FA)
- **Email-based 2FA** for all user roles
- **6-digit verification codes** with 10-minute expiration
- **Resend code functionality** with rate limiting
- **Device trust system** (optional "Remember this device")
- **Mandatory 2FA** for administrators

#### Account Security
- **Password strength validation**
- **Login attempt tracking** (max 5 attempts)
- **Account lockout** after failed attempts
- **Session timeout** after inactivity
- **Password visibility toggle**
- **Forgot password** with email verification

### 2. Student Portal

#### Dashboard Features
- **Profile completion tracker** with progress bar
- **QR code generation** for supervisor evaluation
- **Internship application status**
- **Announcements and notices**
- **Quick stats** (hours logged, evaluations, etc.)

#### Internship Management
- **Browse available internships** with AI-powered recommendations
- **Apply with required documents**:
  - Resume
  - Cover Letter (optional)
  - Parents Consent
  - Internship Contract
  - Health Record
- **Track application status**
- **Single active internship** enforcement

#### Document Submissions
- **Pre-training requirements** upload
- **Narrative reports** (Midterm & Final)
- **Daily time records** (DTR)
- **Certifications** upload

#### Tools & Resources
- **AI Resume Builder** with auto-fill
- **Career Guidance** with AI recommendations
- **Daily Journal** for reflection
- **Attendance tracking**

### 3. Coordinator Portal

#### Student Management
- **View all assigned students** by college
- **Approve/reject pre-training requirements**
- **Bulk verification** of student documents
- **Monitor student progress** in real-time
- **Grade management** and evaluation

#### Application Review
- **Review internship applications**
- **Approve/reject applications**
- **Filter by status, course, company**
- **Search functionality**

#### Monitoring & Analytics
- **Student performance dashboard**
- **Evaluation tracking**
- **Attendance monitoring**
- **Export data** to Excel/PDF

### 4. Supervisor Portal

#### Student Evaluation
- **Scan QR codes** to access student profiles
- **Submit performance evaluations**
- **Rate students** on multiple criteria
- **Provide feedback** and comments
- **Track evaluation history**

#### Attendance Management
- **Mark daily attendance**
- **View attendance reports**
- **Export attendance data**

### 5. Admin Portal

#### User Management
- **Create/edit/delete users**
- **Assign roles** (Student, Coordinator, Supervisor, Admin)
- **Search by Student ID, email, name**
- **View registration dates**
- **Manage user permissions**

#### System Configuration
- **Manage colleges and courses**
- **Configure system settings**
- **Email template management**
- **Backup and restore**

#### Company Management
- **Add/edit companies**
- **Manage internship postings**
- **Track company partnerships**

#### Analytics & Reporting
- **System health monitoring**
- **User activity logs**
- **Audit trail**
- **Export reports**

### 6. Messaging System

#### Features
- **Role-based messaging**
- **Thread-based conversations**
- **Read receipts**
- **File attachments**
- **Search conversations**
- **Auto-generated subjects**

---

## 🔒 Security Features

### Authentication
- ✅ JWT token-based authentication
- ✅ Secure password hashing (PBKDF2)
- ✅ Two-factor authentication (2FA)
- ✅ Session management
- ✅ CSRF protection

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Permission-based views
- ✅ API endpoint protection
- ✅ Resource ownership validation

### Data Protection
- ✅ HTTPS enforcement (production)
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ File upload validation
- ✅ Rate limiting on sensitive endpoints

### Audit & Compliance
- ✅ Audit logging for critical actions
- ✅ User activity tracking
- ✅ Data backup system
- ✅ Error logging and monitoring

---

## 📱 QR Code System

### Overview
Each student has a unique QR code that supervisors can scan to quickly access their evaluation form.

### How It Works

1. **QR Code Generation**
   - Generated automatically for each student
   - Contains encrypted student token
   - Displayed on student dashboard
   - Can be downloaded or printed

2. **QR Code URL Structure**
   ```
   https://your-domain.com/public/student/{encrypted_token}
   ```

3. **Supervisor Workflow**
   - Scan student's QR code with phone
   - Redirected to public evaluation form
   - View student details
   - Submit evaluation
   - No login required for evaluation

### Setup for Development

#### Using ngrok (Development)

**Problem:** Free ngrok URLs change on every restart

**Solution 1: Manual Update (Free)**
```bash
# 1. Start ngrok
ngrok http 3000

# 2. Copy the new ngrok URL (e.g., https://abc123.ngrok-free.dev)

# 3. Update backend/.env
FRONTEND_URL=https://abc123.ngrok-free.dev

# 4. Regenerate QR codes
cd backend
python regenerate_qr_codes.py

# 5. Restart Django server
python manage.py runserver
```

**Solution 2: Automated Script (Free)**
```bash
# Run the update script
update_ngrok_url.bat
```

**Solution 3: ngrok Static Domain (Paid - $8/month)**
```bash
# Get static domain from ngrok dashboard
ngrok http --domain=your-static-domain.ngrok.app 3000

# Update .env once (URL never changes)
FRONTEND_URL=https://your-static-domain.ngrok.app

# Regenerate QR codes once
python regenerate_qr_codes.py
```

### Production Deployment

For thesis defense or production, deploy to a platform with permanent URLs:

**Recommended: Railway (Free)**
- Permanent URL that never changes
- No need for ngrok
- Works 24/7 even when laptop is off
- See [Deployment Guide](#deployment-guide)

---

## 🚀 Deployment Guide

### Option 1: Railway (Recommended - FREE)

#### Why Railway?
- ✅ **100% FREE** ($5/month credit included)
- ✅ **Permanent URL** that never changes
- ✅ **Automatic HTTPS**
- ✅ **Works 24/7** (no laptop needed)
- ✅ **Perfect for thesis defense**

#### Setup Steps

1. **Prepare Django Project**
```bash
cd backend

# Install production dependencies
pip install gunicorn dj-database-url
pip freeze > requirements.txt

# Create railway.json
# (See configuration below)
```

2. **Railway Configuration** (`backend/railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn backend.wsgi:application",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

3. **Update Django Settings** (`backend/backend/settings.py`)
```python
import dj_database_url

# Production settings
ALLOWED_HOSTS = ['*']  # Or specify Railway domain

# Database configuration
if os.getenv('DATABASE_URL'):
    DATABASES['default'] = dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

4. **Deploy to Railway**
   - Sign up at https://railway.app/
   - Connect GitHub repository
   - Add environment variables:
     ```
     DEBUG=False
     SECRET_KEY=your-secret-key
     GOOGLE_API_KEY=your-api-key
     EMAIL_PASSWORD=your-email-password
     FRONTEND_URL=https://your-frontend.vercel.app
     ```
   - Deploy!

5. **Get Permanent URL**
   - Railway provides: `https://your-app.up.railway.app`
   - This URL **never changes**!

6. **Regenerate QR Codes (One Time)**
```bash
# Update .env with Railway URL
FRONTEND_URL=https://your-app.up.railway.app

# Regenerate QR codes
python regenerate_qr_codes.py
```

### Option 2: Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
1. Sign up at https://vercel.com/
2. Import repository
3. Set build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.up.railway.app
   ```

**Backend on Railway:**
- Follow Railway steps above

### Option 3: Traditional VPS (DigitalOcean, AWS, etc.)

For advanced users who need full control:
- Set up Ubuntu server
- Install Python, Node.js, PostgreSQL
- Configure Nginx reverse proxy
- Set up SSL with Let's Encrypt
- Use systemd for process management

---

## 💾 Backup & Maintenance

### Automated Backup System

#### Features
- **Scheduled backups** (daily, weekly, monthly)
- **Database backup** (SQLite/PostgreSQL)
- **Media files backup** (uploads, documents)
- **Backup rotation** (keep last N backups)
- **Restore functionality**
- **Integrity verification**

#### Manual Backup
```bash
cd backend
python backup_system.py
```

#### Automated Backup (Windows)
```powershell
# Run setup script
.\setup_automated_backup.ps1

# This creates a scheduled task that runs daily
```

#### Restore from Backup
```bash
cd backend
python restore_system.py
```

### Database Maintenance

#### Check Database Integrity
```bash
python manage.py check
```

#### Clean Orphaned Files
```bash
# Remove files not referenced in database
python manage.py cleanup_files
```

#### Optimize Database
```bash
# SQLite
python manage.py dbshell
VACUUM;
.exit

# PostgreSQL
python manage.py dbshell
VACUUM ANALYZE;
\q
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. QR Code Shows Blank Page

**Problem:** QR code leads to blank/404 page

**Solution:**
- Ensure ngrok is running for frontend (port 3000)
- Update `FRONTEND_URL` in `.env`
- Regenerate QR codes: `python regenerate_qr_codes.py`
- Restart Django server

#### 2. 2FA Code Not Received

**Problem:** Email verification code not arriving

**Solution:**
- Check email configuration in `.env`
- Verify `EMAIL_PASSWORD` is correct (use App Password for Gmail)
- Check spam/junk folder
- Test email: `python send_test_email.py`

#### 3. Login Failed - Account Locked

**Problem:** Too many failed login attempts

**Solution:**
```bash
# Unlock account
python unlock_account.py <username>

# Or clear all locks
python clear_locks.py
```

#### 4. Frontend Can't Connect to Backend

**Problem:** CORS errors or connection refused

**Solution:**
- Check backend is running on port 8000
- Verify `REACT_APP_API_URL` in frontend `.env`
- Check CORS settings in Django `settings.py`
- Ensure `ALLOWED_HOSTS` includes frontend domain

#### 5. Database Migration Errors

**Problem:** Migration conflicts or errors

**Solution:**
```bash
# Reset migrations (DEVELOPMENT ONLY)
python manage.py migrate --fake core zero
python manage.py migrate core

# Or create fresh database
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

#### 6. File Upload Fails

**Problem:** Documents not uploading

**Solution:**
- Check `MEDIA_ROOT` and `MEDIA_URL` in settings
- Verify file size limits
- Check file permissions on media folder
- Ensure allowed file types are configured

---

## 📡 API Reference

### Authentication Endpoints

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "student123",
  "password": "password123"
}

Response:
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "user": {
    "id": 1,
    "username": "student123",
    "email": "student@example.com",
    "role": "student"
  }
}
```

#### Verify 2FA
```http
POST /api/auth/verify-2fa/
Content-Type: application/json

{
  "user_id": 1,
  "code": "123456",
  "trust_device": true
}
```

#### Refresh Token
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "jwt_refresh_token"
}
```

### Student Endpoints

#### Get Student Profile
```http
GET /api/students/profile/
Authorization: Bearer {access_token}
```

#### Update Profile
```http
PUT /api/students/profile/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "09123456789",
  "address": "123 Main St"
}
```

#### Apply for Internship
```http
POST /api/students/apply/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

{
  "internship_id": 1,
  "resume": <file>,
  "cover_letter": <file>,
  "parents_consent": <file>,
  "internship_contract": <file>,
  "health_record": <file>
}
```

### Coordinator Endpoints

#### Get Students by College
```http
GET /api/coordinators/students/?college=CCS
Authorization: Bearer {access_token}
```

#### Approve Requirement
```http
POST /api/coordinators/approve-requirement/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "requirement_id": 1,
  "status": "approved",
  "remarks": "All documents complete"
}
```

### Supervisor Endpoints

#### Get Student by Token (Public)
```http
GET /api/public/student/{token}/
```

#### Submit Evaluation
```http
POST /api/supervisors/evaluate/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "student_id": 1,
  "rating": 4.5,
  "attendance": 5,
  "quality_of_work": 4,
  "initiative": 5,
  "teamwork": 4,
  "comments": "Excellent performance"
}
```

### Admin Endpoints

#### Get All Users
```http
GET /api/admin/users/
Authorization: Bearer {access_token}
```

#### Create User
```http
POST /api/admin/users/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "student",
  "first_name": "New",
  "last_name": "User"
}
```

---

## 📊 Database Schema

### Core Models

#### User
- `id`: Primary Key
- `username`: Unique
- `email`: Unique
- `password`: Hashed
- `role`: student/coordinator/supervisor/admin
- `first_name`, `last_name`
- `is_verified`: Boolean
- `is_2fa_enabled`: Boolean
- `created_at`, `updated_at`

#### StudentProfile
- `user`: OneToOne → User
- `student_id`: Unique
- `college`: ForeignKey → College
- `course`: ForeignKey → Course
- `year_level`: Integer
- `section`: String
- `phone`, `address`
- `qr_code`: Text (base64)
- `qr_token`: Unique encrypted token

#### Internship
- `company`: ForeignKey → Company
- `title`: String
- `description`: Text
- `requirements`: Text
- `slots`: Integer
- `start_date`, `end_date`
- `is_active`: Boolean

#### Application
- `student`: ForeignKey → StudentProfile
- `internship`: ForeignKey → Internship
- `status`: pending/approved/rejected
- `resume`, `cover_letter`, etc.: FileField
- `applied_at`, `reviewed_at`

#### Evaluation
- `student`: ForeignKey → StudentProfile
- `supervisor`: ForeignKey → SupervisorProfile
- `rating`: Decimal
- `criteria_scores`: JSON
- `comments`: Text
- `evaluated_at`: DateTime

---

## 🎓 For Thesis Defense

### Pre-Defense Checklist

- [ ] Deploy to Railway or similar platform
- [ ] Test all user roles (Student, Coordinator, Supervisor, Admin)
- [ ] Generate and test QR codes
- [ ] Prepare sample data (students, companies, internships)
- [ ] Test QR code scanning on mobile devices
- [ ] Backup database before demo
- [ ] Prepare presentation slides
- [ ] Document AI integration explanation
- [ ] Test all critical features
- [ ] Have backup plan (local setup with ngrok)

### Demo Flow Suggestion

1. **Admin Login** - Show user management
2. **Coordinator Login** - Show student monitoring
3. **Student Login** - Show internship application
4. **QR Code Demo** - Scan with phone, show evaluation
5. **Supervisor Login** - Show evaluation submission
6. **Analytics** - Show reports and statistics

### Key Features to Highlight

- ✨ **AI-Powered Recommendations** (Google Gemini integration)
- 🔒 **Two-Factor Authentication** (Security)
- 📱 **QR Code System** (Innovation)
- 📊 **Real-time Analytics** (Data-driven)
- 🎨 **Modern UI/UX** (User experience)
- 💾 **Automated Backups** (Reliability)

---

## 📞 Support & Contact

For issues, questions, or contributions:

- **GitHub Issues**: [Create an issue]
- **Email**: support@earist-ojt.com
- **Documentation**: This file

---

## 📝 License

This project is developed for academic purposes as part of a thesis requirement.

---

## 🙏 Acknowledgments

- **Earist University** - For the opportunity
- **Google Gemini AI** - For AI-powered features
- **Django & React Communities** - For excellent frameworks
- **All Contributors** - For making this project possible

---

**Last Updated:** February 7, 2026  
**Version:** 1.0.0 Production Ready  
**Status:** ✅ Thesis Defense Ready
