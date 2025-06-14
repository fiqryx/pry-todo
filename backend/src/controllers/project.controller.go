package controllers

import (
	"strings"
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/services"
	"webservices/src/types/schemas"

	"github.com/gin-gonic/gin"
)

type ProjectController struct {
	projectService *services.ProjectService
	notifService   *services.NotificationService
}

func NewProjectController(
	projectService *services.ProjectService,
	notifService *services.NotificationService,
) *ProjectController {
	return &ProjectController{
		projectService: projectService,
		notifService:   notifService,
	}
}

func (ctrl *ProjectController) GetProjects(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var filter schemas.FilterProject
	if err := c.ShouldBindJSON(&filter); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	projects, err := ctrl.projectService.GetProjects(user.ID, filter)
	if err != nil {
		c.AbortWithStatusJSON(404, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": projects})
}

func (ctrl *ProjectController) GetProjectActive(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	if user.ProjectID == nil || *user.ProjectID == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "You dont have any project"})
		return
	}

	project, err := ctrl.projectService.GetIncludeUsers(user.ID, *user.ProjectID)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": project})
}

func (ctrl *ProjectController) Upsert(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.CreateProject
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	var (
		project *model.Project
		err     error
	)

	if body.ID == nil {
		project, err = ctrl.projectService.Create(
			user.ID,
			body.Name,
			body.Image,
			body.Color,
			body.Description,
		)
	} else {
		project, err = ctrl.projectService.Update(
			user.ID,
			*body.ID,
			body.Name,
			body.Image,
			body.Color,
			body.Description,
		)
	}

	if err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": project})
}

func (ctrl *ProjectController) ChangeProject(c *gin.Context) {
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

	project, err := ctrl.projectService.UpdateUserProject(user.ID, id)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": project})
}

func (ctrl *ProjectController) ChangeAccess(c *gin.Context) {
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

	var body schemas.UpdateAccess
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	if body.UserID == "" || body.Role == nil || *body.Role == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	userProject, err := ctrl.projectService.UpdateRole(id, user.ID, body.UserID, *body.Role)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	go ctrl.notifService.PushTeamAccess(&user, userProject, false)

	c.AbortWithStatusJSON(200, gin.H{"data": body})
}

func (ctrl *ProjectController) UpdateSetting(c *gin.Context) {
	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	projectID, ok := body["projectId"].(string)
	if !ok || projectID == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "ProjectId is required"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	setting, err := ctrl.projectService.UpdateSetting(user.ID, projectID, body)
	if err != nil {
		code := 500
		if strings.Contains(err.Error(), "not found") {
			code = 404
		}
		c.AbortWithStatusJSON(code, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": setting})
}

func (ctrl *ProjectController) RemoveTeam(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "Not found"})
		return
	}

	var body schemas.UpdateAccess
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	if body.UserID == "" {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	team, err := ctrl.projectService.RemoveFromTeam(id, user.ID, body.UserID)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	go ctrl.notifService.PushTeamAccess(&user, team, true)

	c.AbortWithStatusJSON(200, gin.H{"data": body})
}

func (ctrl *ProjectController) Delete(c *gin.Context) {
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

	replacement, err := ctrl.projectService.Delete(user.ID, id)
	if err != nil {
		code := 500
		if strings.Contains(err.Error(), "found") {
			code = 404
		}

		c.AbortWithStatusJSON(code, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": replacement})
}
