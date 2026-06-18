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

### Clone the Repository

```bash
git clone https://github.com/fiqryx/pry-todo.git
cd pry-todo
```

### How to build
- **Windows**
```bash
$ ./build.sh --os windows --arch amd64
# for arm64
$ ./build.sh --os windows --arch arm64
```

- **Linux**
```bash
$ ./build.sh --os linux --arch amd64
# for arm64
$ ./build.sh --os linux --arch arm64
```

- **Docker**
```bash
$ ./build.sh --os linux --arch amd64
$ cp .build/backend/.env.example .build/backend/.env
$ cp .build/frontend/.env.example .build/frontend/.env
$ docker compose up -d --build
```

### Manual Environment Setup

Copy the environment example files:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment  
cp frontend/.env.example frontend/.env
```

### Configure Environment Variables

Add the following variables to both `backend/.env` and `frontend/.env`:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration
MAIL_HOST=your_smtp_host
MAIL_PORT=your_smtp_port
MAIL_USERNAME=your_email_username
MAIL_PASSWORD=your_email_password
```

### Install Dependencies & Run

**Backend (Go):**
```bash
cd backend
go mod download
go run main.go serve
```

**Frontend (Next.js):**
```bash
cd frontend
bun install
bun run dev
```

The application will be available at:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:8000`

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