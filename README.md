# PryTodo

A powerful and intuitive project management web application inspired by Jira, built for modern teams who need flexibility and clarity in their workflow management.

[![Pry](./screenshots/main-page.png)](https://pry-todo.vercel.app/)

## ✨ Features

- **📋 Kanban Board** - Visual task management with drag & drop functionality
- **📊 Analytics Dashboard** - Comprehensive project insights and reporting
- **📝 Backlog Management** - Prioritize and organize your tasks efficiently
- **📅 Timeline View** - Track project progress and deadlines
- **🎯 Drag & Drop Interface** - Seamless task organization across columns
- **👥 Team Collaboration** - Multi-user support with role-based permissions
- **📸 File Attachments** - Upload and manage project assets with Cloudinary
- **📧 Email Notifications** - Stay updated on project changes

[![Pry](./screenshots/analytic-pages.png)](https://pry-todo.vercel.app/)

## 🛠️ Tech Stack

- **Frontend**: Next.js (React Framework)
- **Backend**: Go (Golang)
- **Database**: PostgreSQL with Supabase
- **File Storage**: Cloudinary
- **Email Service**: SMTP Configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **Go** (v1.19 or higher)
- **Git**

You'll also need accounts and API keys for:
- [Supabase](https://supabase.com/) (Database & Auth)
- [Cloudinary](https://cloudinary.com/) (File Storage)
- SMTP Email Service (Gmail, SendGrid, etc.)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/fiqryx/pry-todo.git
cd pry-todo
```

### 2. Environment Setup

Copy the environment example files:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment  
cp frontend/.env.example frontend/.env
```

### 3. Configure Environment Variables

Add the following variables to both `backend/.env` and `frontend/.env`:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
MAIL_HOST=your_smtp_host
MAIL_PORT=your_smtp_port
MAIL_USERNAME=your_email_username
MAIL_PASSWORD=your_email_password
```

### 4. Install Dependencies & Run

**Backend (Go):**
```bash
cd backend
go mod download
go run main.go
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:8000`

## 🔧 Configuration Details

### Database Setup
PryTodo uses PostgreSQL which can be set up locally:
1. Install PostgreSQL on your system
2. Create a new database: createdb prytodo
3. Set your DATABASE_URL to: postgresql://username:password@localhost:5432/prytodo

### Cloudinary Setup
1. Create a Cloudinary account
2. Navigate to your Dashboard
3. Copy the Cloud Name, API Key, and API Secret

### Email Configuration
Configure your SMTP settings for email notifications:
- **Gmail**: Use App Passwords for authentication
- **SendGrid**: Use your API key as the password
- **Custom SMTP**: Use your server credentials

## 📱 Usage

1. **Create Projects** - Set up new projects with custom workflows
2. **Manage Tasks** - Add, edit, and organize tasks in your backlog
3. **Use Kanban Board** - Drag and drop tasks between columns
4. **Track Progress** - Monitor project timeline and analytics
5. **Collaborate** - Invite team members and assign tasks

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/fiqryx/pry-todo/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🎯 Roadmap

- [&check;] Mobile responsive design improvements
- [&check;] Advanced filtering and search
- [ ] Integration with third-party tools
- [ ] Real-time collaboration features
- [ ] Advanced reporting and exports
- [ ] API documentation

---

**Made with ❤️ by the PryTodo Team**