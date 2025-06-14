package schemas

import "webservices/src/types"

type CreateItem struct {
	Type     types.IssueItemType `json:"type" binding:"required,oneof=attachment web_link link_work"`
	Url      *string             `json:"url" binding:"omitempty"`
	Text     *string             `json:"text" binding:"omitempty"`
	AssetID  *string             `json:"assetId" binding:"omitempty"`
	PublicID *string             `json:"publicId" binding:"omitempty"`
}
