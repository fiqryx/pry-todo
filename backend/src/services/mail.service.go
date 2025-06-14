package services

import (
	"bytes"
	"fmt"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"text/template"
	"time"
	"webservices/src/model"
	"webservices/src/pkg/cipher"
	c "webservices/src/pkg/common"
	"webservices/src/repo"
	"webservices/src/types"

	"gopkg.in/mail.v2"
)

type MailConfig struct {
	Host      string
	Port      int
	Username  string
	Password  string
	SSL       bool
	Identity  string
	LocalName string
	Secret    []byte
	AppName   string
	BaseUrl   string
}

type MailOptions struct {
	From        string
	To          []string
	Cc          []string
	Bcc         []string
	Subject     string
	Body        string
	HTMLBody    string
	Attachments []string
}

type MailService struct {
	mu       sync.RWMutex
	storage  map[string]any
	userRepo *repo.UserRepository
	*MailConfig
}

func NewMailService(userRepo *repo.UserRepository, config *MailConfig) *MailService {
	storage := make(map[string]any)
	mail := &MailService{
		storage:    storage,
		MailConfig: config,
		userRepo:   userRepo,
	}

	if mail.MailConfig == nil {
		mail.MailConfig = mail.getConfig()
	}

	return mail
}

func (s *MailService) InviteProject(
	project model.Project,
	sender model.User,
	role types.UserProjectRole,
	to, message string,
) error {
	id := c.Random(16)
	payload := map[string]any{
		"id":       id,
		"sender":   sender.Email,
		"receiver": to,
		"role":     role,
		"project":  project.ID,
		"expired":  time.Now().Add(time.Hour * 1).Unix(),
	}

	s.mu.Lock()
	s.storage[id] = payload
	s.mu.Unlock()

	signature, err := cipher.Encrypt(s.Secret, payload)
	if err != nil {
		return fmt.Errorf("failed to create signature: %w", err)
	}

	if message == "" {
		message = s.getMessage(sender.Name, project.Name)
	}

	data := map[string]any{
		"ProjectName":   project.Name,
		"PlatformName":  s.AppName,
		"InviterName":   sender.Name,
		"InviterAvatar": sender.Image,
		"CustomMessage": message,
		"AcceptLink":    fmt.Sprintf("%s/verify/project?token=%s", s.BaseUrl, *signature),
		"CurrentYear":   time.Now().Year(),
		"Role":          role,
	}

	text := `You're Invited! 🚀

{{.InviterName}} has invited you to collaborate on {{.ProjectName}} on {{.PlatformName}}.

Project: {{.ProjectName}}
{{if .Role}}Role: {{.Role}}{{end}}

{{if .CustomMessage}}
{{.CustomMessage}}
{{end}}

To accept this invitation, click here or copy and paste this URL into your browser:
{{.AcceptLink}}

If you don't want to join, you can ignore this email.

---
© {{.CurrentYear}} {{.PlatformName}}. All rights reserved.`

	var plainTextBuf bytes.Buffer
	tmpl := template.Must(template.New("plaintext").Parse(text))
	if err := tmpl.Execute(&plainTextBuf, data); err != nil {
		return fmt.Errorf("failed to execute plain text template: %w", err)
	}

	from := fmt.Sprintf(
		"%s <noreply@%s>",
		s.getSenderName(sender.Name),
		strings.ToLower(strings.ReplaceAll(s.AppName, " ", "")),
	)

	options := MailOptions{
		From:    from,
		To:      []string{to},
		Subject: "You're invited to join",
		Body:    plainTextBuf.String(),
	}

	return s.send(options)
}

func (s *MailService) IssueAssign(user *model.User, project *model.Project, issue *model.Issue) error {
	if issue == nil || issue.AssigneeID == nil || user.ID == *issue.AssigneeID {
		return nil
	}

	settings := project.Setting
	if settings != nil && !settings.NotifyOnAssignment {
		return nil
	}

	receiver, err := s.userRepo.GetByID(*issue.AssigneeID)
	if err != nil {
		return err
	}

	from := fmt.Sprintf(
		"%s Notifications <noreply@%s>", s.AppName,
		strings.ToLower(strings.ReplaceAll(s.AppName, " ", "")),
	)

	dueDate := ""
	if issue.DueDate != nil {
		dueDate = fmt.Sprintf("Due Date: %s", issue.DueDate.Format("January 2, 2006"))
	}

	message := fmt.Sprintf(`
You've been assigned to a new task:

Project: %s
Task: %s
Priority: %s
%s
Status: %s

Click here to view details: %s/issue/%s
`,
		project.Name,
		issue.Title,
		issue.Priority,
		dueDate,
		issue.Status.ToString(),
		s.BaseUrl,
		issue.ID,
	)

	options := MailOptions{
		From:    from,
		To:      []string{receiver.Email},
		Subject: fmt.Sprintf("🎯 New Task Assigned: %s [%s]", issue.Title, project.Name),
		Body:    strings.TrimSpace(message),
	}

	return s.send(options)
}

func (s *MailService) VerifyToken(token string) (map[string]any, error) {
	decrypted, err := cipher.Decrypt[map[string]any](s.Secret, token)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	id, ok := (*decrypted)["id"].(string)
	if !ok || id == "" {
		return nil, fmt.Errorf("invalid token format")
	}

	payload, exists := s.getPayload(id)
	if !exists {
		return nil, fmt.Errorf("token not found")
	}

	if expired, ok := payload["expired"].(int64); ok {
		if time.Now().Unix() > expired {
			s.mu.Lock()
			delete(s.storage, id)
			s.mu.Unlock()
			return nil, fmt.Errorf("token has expired")
		}
	}

	return payload, nil
}

func (s *MailService) ClearMutex(id string) error {
	_, exists := s.getPayload(id)
	if !exists {
		return fmt.Errorf("fialed to clear: payload does't exists")
	}

	s.mu.Lock()
	delete(s.storage, id)
	s.mu.Unlock()

	return nil
}

// helper

func (s *MailService) send(op MailOptions) error {
	msg := mail.NewMessage()

	msg.SetHeader("From", op.From)
	msg.SetHeader("To", op.To...)

	if len(op.Cc) > 0 {
		msg.SetHeader("Cc", op.Cc...)
	}

	if len(op.Bcc) > 0 {
		msg.SetHeader("Bcc", op.Bcc...)
	}

	msg.SetHeader("Subject", op.Subject)

	if op.HTMLBody != "" {
		msg.SetBody("text/html", op.HTMLBody)
		if op.Body != "" {
			msg.AddAlternative("text/plain", op.Body)
		}
	} else {
		msg.SetBody("text/plain", op.Body)
	}

	for _, f := range op.Attachments {
		msg.Attach(f)
	}

	d := mail.NewDialer(s.Host, s.Port, s.Username, s.Password)

	if s.SSL {
		d.SSL = true
	} else {
		d.StartTLSPolicy = mail.MandatoryStartTLS
	}

	if s.LocalName != "" {
		d.LocalName = s.LocalName
	}

	if err := d.DialAndSend(msg); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (s *MailService) getConfig() *MailConfig {
	port, _ := strconv.Atoi(c.Env("MAIL_PORT"))
	secret := []byte(c.Env("APP_SECRET"))

	return &MailConfig{
		AppName:  c.Env("APP_NAME"),
		BaseUrl:  c.Env("APP_URL"),
		Host:     c.Env("MAIL_HOST"),
		Port:     port,
		Secret:   secret,
		Username: c.Env("MAIL_USERNAME"),
		Password: c.Env("MAIL_PASSWORD"),
	}
}

func (s *MailService) getMessage(name, label string) string {
	messages := []string{
		fmt.Sprintf("🌟 %s is assembling the dream team for '%s' - and you're invited!", name, label),
		fmt.Sprintf("🚀 %s wants to collaborate with you on '%s'. Ready for takeoff?", name, label),
		fmt.Sprintf("🎯 Perfect aim! %s has selected you to join '%s'", name, label),
		fmt.Sprintf("🧩 %s is putting together '%s' and you're the missing piece!", name, label),
		fmt.Sprintf("🌈 Opportunity alert! %s invites you to join '%s'", name, label),
		fmt.Sprintf("🤝 %s would love your expertise on '%s'. Let's create something amazing!", name, label),
		fmt.Sprintf("⚡ Power up! %s is inviting you to energize '%s'", name, label),
		fmt.Sprintf("👑 Your skills are requested! %s invites you to rule '%s' together", name, label),
		fmt.Sprintf("🌱 Let's grow something great! %s welcomes you to '%s'", name, label),
		fmt.Sprintf("🎨 Blank canvas alert! %s wants to create '%s' with you", name, label),
	}

	rand.Seed(time.Now().UnixNano())
	return messages[rand.Intn(len(messages))]
}

func (s *MailService) getPayload(id string) (map[string]any, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	payload, exists := s.storage[id]
	if !exists {
		return nil, false
	}

	return payload.(map[string]any), true
}

func (s *MailService) getSenderName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Team"
	}
	reg := regexp.MustCompile(`[^\p{L}\p{N}\s-]`)
	name = reg.ReplaceAllString(name, "")
	return strings.Join(strings.Fields(name), " ")
}
