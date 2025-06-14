package model

import (
	"time"
	"webservices/src/types"
)

type Project struct {
	ID                string                `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id" `
	OwnerID           string                `json:"ownerId" `
	Name              string                `gorm:"not null" json:"name" `
	Category          *string               `json:"category,omitempty"`
	Description       *string               `json:"description,omitempty"`
	Image             *string               `json:"image,omitempty"`
	Color             *string               `json:"color,omitempty"`
	Order             int                   `gorm:"column:order_index;default:0" json:"order"`
	Status            types.ProjectStatus   `gorm:"type:project_status;default:'active'" json:"status"`
	LastAssignedIndex *int                  `gorm:"column:last_assigned_index;default:0" json:"lastAssignedIndex,omitempty"`
	CreatedAt         time.Time             `gorm:"column:created_at;default:now();<-:create" json:"createdAt"`
	UpdatedAt         time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	Role              types.UserProjectRole `gorm:"-:all" json:"role,omitempty" comment:"this field obtained from user_projects"`

	Setting     *ProjectSetting  `gorm:"foreignKey:ProjectID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"setting,omitempty"`
	ActiveUsers []User           `gorm:"foreignKey:ProjectID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"activeUsers,omitempty"`
	Users       []User           `gorm:"many2many:user_projects;" json:"users,omitempty"`
	Issues      []Issue          `gorm:"constraint:OnDelete:CASCADE;" json:"issues,omitempty"`
	Activities  []RecentActivity `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"activities,omitempty"`
}

func (Project) TableName() string {
	return "projects"
}
