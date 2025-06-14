package model

import (
	"time"
	"webservices/src/types"
)

type IssueItem struct {
	ID        string              `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	IssueID   string              `gorm:"type:uuid" json:"issueId"`
	Type      types.IssueItemType `gorm:"not null;type:issue_item_type;" json:"type"`
	AssetID   *string             `json:"assetId"`
	PublicID  *string             `json:"publicId"`
	Url       *string             `json:"url"`
	Text      *string             `json:"text"`
	CreatedAt time.Time           `gorm:"column:created_at;default:now();<-:create" json:"createdAt"`
	UpdatedAt time.Time           `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	Issue      Issue            `gorm:"foreignKey:IssueID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"issue,omitzero"`
	Activities []RecentActivity `gorm:"foreignKey:ItemID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"activities,omitempty"`
}

func (IssueItem) TableName() string {
	return "issue_items"
}
