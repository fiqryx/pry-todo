package controllers

import (
	"strings"
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/services"
	"webservices/src/types/schemas"

	"github.com/gin-gonic/gin"
)

type IssueController struct {
	issueService *services.IssueService
	notifService *services.NotificationService
	mailService  *services.MailService
}

func NewIssueController(
	issueService *services.IssueService,
	notifService *services.NotificationService,
	mailService *services.MailService,
) *IssueController {
	return &IssueController{
		issueService: issueService,
		notifService: notifService,
		mailService:  mailService,
	}
}

func (ctrl *IssueController) AnalyticIssues(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	if user.ProjectID == nil || *user.ProjectID == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "failed to fetch: project ID empty"})
		return
	}

	issues, err := ctrl.issueService.GetByProject(*user.ProjectID)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": issues})
}

func (ctrl *IssueController) GetIssues(c *gin.Context) {
	parents := c.Query("id")

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	if user.ProjectID == nil || *user.ProjectID == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "failed to fetch: project ID empty"})
		return
	}

	issues, err := ctrl.issueService.GetWithParents(*user.ProjectID, parents)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": issues})
}

func (ctrl *IssueController) GetIssuesWithFilter(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var filter schemas.FilterIssue
	if err := c.ShouldBindJSON(&filter); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	if user.ProjectID == nil || *user.ProjectID == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "failed to fetch: project ID empty"})
		return
	}

	projectID := *user.ProjectID
	issues, err := ctrl.issueService.GetWithFilter(projectID, filter)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": issues})
}

func (ctrl *IssueController) GetIssueByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "Not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	issue, err := ctrl.issueService.GetIssue(id)
	if err != nil {
		code := 500
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "incorrect UUID format") {
			code = 404
		}
		c.AbortWithStatusJSON(code, gin.H{"error": err.Error()})
		return
	}

	// [optional] can only access issue on (current/active) project
	if user.ProjectID == nil || *user.ProjectID != issue.ProjectID {
		c.AbortWithStatusJSON(404, gin.H{"error": "Not found"})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": issue})
}

func (ctrl *IssueController) GetActivitiesByIssue(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "Not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	activities, err := ctrl.issueService.GetActivities(id)
	if err != nil {
		code := 500
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "incorrect UUID format") {
			code = 404
		}
		c.AbortWithStatusJSON(code, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": activities})
}

func (ctrl *IssueController) Upsert(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.CreateIssue
	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	if body.ProjectID == nil {
		if user.ProjectID == nil {
			c.AbortWithStatusJSON(400, gin.H{"error": "you dont have any active project"})
			return
		}
		body.ProjectID = user.ProjectID
	}

	var (
		issue *model.Issue
		err   error
	)

	isCreate := body.ID == nil || *body.ID == ""

	if isCreate {
		issue, err = ctrl.issueService.Create(user.ID, body)
	} else {
		issue, err = ctrl.issueService.Update(user.ID, body)
	}

	if err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	go func() {
		ctrl.notifService.PushIssue(&user, issue, isCreate)
		if err := ctrl.mailService.IssueAssign(&user, user.Project, issue); err != nil {
			logger.Errorf("failed to send assign issue email: %s", err)
		}
	}()

	c.AbortWithStatusJSON(200, gin.H{"data": issue})
}

func (ctrl *IssueController) UpdateOrder(c *gin.Context) {
	var body schemas.IssueOrder
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	issues, err := ctrl.issueService.UpdateSequence(user.ID, body.ID, body.Direction)
	if err != nil {
		logger.Errorf("failed update issue sequence: %s", err)
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": issues})
}

func (ctrl *IssueController) MoveParent(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.MoveParent
	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	if body.ID == "" || body.Parents == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	if body.ID == body.Parents {
		c.AbortWithStatusJSON(400, "cannot set parent to self")
		return
	}

	issue, err := ctrl.issueService.UpdateParent(user.ID, body.ID, body.Parents)
	if err != nil {
		logger.Error(err)
		status := 400
		if strings.Contains(err.Error(), "not found") {
			status = 404
		}
		c.AbortWithStatusJSON(status, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": issue})
}

func (ctrl *IssueController) RemoveParent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "Not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	issue, err := ctrl.issueService.RemoveParent(user.ID, id)
	if err != nil {
		code := 500
		if strings.Contains(err.Error(), "not found") {
			code = 404
		}
		c.AbortWithStatusJSON(code, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": issue})
}

func (ctrl *IssueController) Delete(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "Not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	if err := ctrl.issueService.Delete(user.ID, id); err != nil {
		logger.Errorf("failed to delete issue: %s", err)
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"message": "Issue deleted successfully"})
}
