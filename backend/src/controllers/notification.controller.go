package controllers

import (
	"fmt"
	"strings"
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/services"
	"webservices/src/types"
	"webservices/src/types/schemas"

	"github.com/gin-gonic/gin"
)

type NotificationController struct {
	mailService    *services.MailService
	projectService *services.ProjectService
	notifService   *services.NotificationService
}

func NewNotificationController(
	mailService *services.MailService,
	projectService *services.ProjectService,
	notifService *services.NotificationService,
) *NotificationController {
	return &NotificationController{
		mailService:    mailService,
		projectService: projectService,
		notifService:   notifService,
	}
}

func (ctrl *NotificationController) GetNotifications(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	notifications, err := ctrl.notifService.GetByUser(user.ID)
	if err != nil {
		message := fmt.Sprintf("failed to fetch issues: %s", err.Error())
		c.AbortWithStatusJSON(500, gin.H{"error": message})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": notifications})
}

func (ctrl *NotificationController) InviteProject(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.InviteProject
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	if body.ID == nil || *body.ID == "" {
		body.ID = user.ProjectID
	}

	project, receiver, err := ctrl.projectService.GetInvitePayload(*body.ID, body.Email)
	if err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	go func() {
		ctrl.notifService.PushProjectInvite(project, &user, receiver)

		if err := ctrl.mailService.InviteProject(*project, user, body.Role, receiver.Email, body.Message); err != nil {
			logger.Errorf("failed to send invitation email: %v", err)
		}

		logger.Debugf("invitation successfully sent to %s", receiver.Email)
	}()

	c.AbortWithStatusJSON(200, gin.H{"data": "Invitation have been sent"})
}

func (ctrl *NotificationController) InviteProjectVerify(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "invalid token"})
		return
	}

	payload, err := ctrl.mailService.VerifyToken(token)
	if err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": err.Error()})
		return
	}

	projectID, ok := payload["project"].(string)
	if !ok || projectID == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "Invalid project in invitation"})
		return
	}

	senderEmail, ok := payload["sender"].(string)
	if !ok || senderEmail == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "Invalid sender in invitation"})
		return
	}

	receiverEmail, ok := payload["receiver"].(string)
	if !ok || receiverEmail == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "Invalid receiver in invitation"})
		return
	}

	role, ok := payload["role"].(types.UserProjectRole)
	if !ok || receiverEmail == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "Invalid access level in invitation"})
		return
	}

	project, err := ctrl.projectService.CreateUserProject(projectID, receiverEmail, role)

	if err != nil {
		statusCode := 500
		if strings.Contains(err.Error(), "not found") {
			statusCode = 404
		}
		c.AbortWithStatusJSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	id, _ := payload["id"].(string)
	go ctrl.mailService.ClearMutex(id)

	c.JSON(200, gin.H{
		"data": gin.H{
			"id":   project.ID,
			"name": project.Name,
			"role": role.String(),
		},
	})
}
