package model

import (
	"errors"
	"time"
	"webservices/src/types"

	"github.com/gin-gonic/gin"
	"github.com/zishang520/socket.io/v2/socket"
)

type User struct {
	ID        string                `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	ProjectID *string               `gorm:"type:uuid;column:project_id" json:"projectId,omitempty"`
	Name      string                `gorm:"not null" json:"name"`
	Email     string                `gorm:"not null" json:"email"`
	Image     *string               `json:"image,omitempty"`
	Color     *string               `json:"color,omitempty"`
	CreatedAt time.Time             `gorm:"column:created_at;default:now();<-:create" json:"createdAt"`
	UpdatedAt time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	Role      types.UserProjectRole `gorm:"-:all" json:"role,omitempty" comment:"this field obtained from user_projects"`

	Project        *Project         `gorm:"foreignKey:ProjectID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"project,omitempty"`
	Projects       []Project        `gorm:"many2many:user_projects;" json:"projects,omitempty"`
	IssuesAssignee []Issue          `gorm:"foreignKey:AssigneeID" json:"issuesAssignee,omitempty"`
	IssuesReporter []Issue          `gorm:"foreignKey:ReporterID" json:"issuesReporter,omitempty"`
	Comments       []Comment        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"comments,omitempty"`
	Activities     []RecentActivity `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"activities,omitempty"`
}

func (User) TableName() string {
	return "users"
}

func (user *User) GetContext(ctx *gin.Context) error {
	context, exist := ctx.Get("user")
	if !exist {
		return errors.New("unauthorized: user context not found")
	}

	userCtx, ok := context.(*User)
	if !ok {
		return errors.New("unauthorized: invalid context type")
	}

	*user = *userCtx

	return nil
}

func (user *User) GetContextSocket(s *socket.Socket) error {
	context, exist := s.Data().(map[string]any)
	if !exist {
		return errors.New("unauthorized")
	}

	userCtx, ok := context["user"].(*User)
	if !ok {
		return errors.New("unauthorized")
	}

	*user = *userCtx

	return nil
}
